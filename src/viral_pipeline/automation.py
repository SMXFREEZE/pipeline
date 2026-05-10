from __future__ import annotations

import json
import sqlite3
import uuid
from contextlib import contextmanager
from dataclasses import asdict, dataclass
from datetime import datetime, timedelta, timezone
from enum import Enum
from pathlib import Path
from typing import Any, Iterator

from viral_pipeline.campaigns.startup import StartupCampaignGenerator, StartupVideoBrief
from viral_pipeline.captions import TemplateCaptionGenerator
from viral_pipeline.config import Settings
from viral_pipeline.db import PipelineStore
from viral_pipeline.models import PublishingJob
from viral_pipeline.orchestration.openmontage import OpenMontageClient
from viral_pipeline.pipeline import ContentPipeline
from viral_pipeline.publishing.manual_queue import ManualReviewQueue
from viral_pipeline.publishing.postiz import PostizPublisher


class AutomationMode(str, Enum):
    CONTINUOUS = "continuous"
    SCHEDULED = "scheduled"


class AutomationStatus(str, Enum):
    ACTIVE = "active"
    STOPPED = "stopped"
    COMPLETED = "completed"
    ERROR = "error"


@dataclass(frozen=True)
class AutomationJob:
    id: str
    startup_name: str
    description: str
    audience: str
    offer: str
    tone: str
    keywords: tuple[str, ...]
    platforms: tuple[str, ...]
    mode: AutomationMode
    interval_minutes: int
    scheduled_at: datetime | None
    auto_publish: bool
    status: AutomationStatus
    next_run_at: datetime | None
    last_run_at: datetime | None
    run_count: int
    logo_path: str | None = None

    def to_dict(self) -> dict[str, Any]:
        payload = asdict(self)
        payload["mode"] = self.mode.value
        payload["status"] = self.status.value
        payload["scheduled_at"] = _dt_to_str(self.scheduled_at)
        payload["next_run_at"] = _dt_to_str(self.next_run_at)
        payload["last_run_at"] = _dt_to_str(self.last_run_at)
        return payload


@dataclass(frozen=True)
class AutomationRun:
    id: str
    job_id: str
    status: str
    message: str
    candidates: tuple[str, ...]
    created_at: datetime

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "job_id": self.job_id,
            "status": self.status,
            "message": self.message,
            "candidates": self.candidates,
            "created_at": _dt_to_str(self.created_at),
        }


class AutomationStore:
    def __init__(self, db_path: Path) -> None:
        self.db_path = db_path
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.initialize()

    @contextmanager
    def connect(self) -> Iterator[sqlite3.Connection]:
        connection = sqlite3.connect(self.db_path)
        connection.row_factory = sqlite3.Row
        try:
            yield connection
            connection.commit()
        finally:
            connection.close()

    def initialize(self) -> None:
        with self.connect() as connection:
            connection.executescript(
                """
                CREATE TABLE IF NOT EXISTS automation_jobs (
                    id TEXT PRIMARY KEY,
                    startup_name TEXT NOT NULL,
                    description TEXT NOT NULL,
                    audience TEXT NOT NULL,
                    offer TEXT NOT NULL,
                    tone TEXT NOT NULL,
                    keywords_json TEXT NOT NULL,
                    platforms_json TEXT NOT NULL,
                    mode TEXT NOT NULL,
                    interval_minutes INTEGER NOT NULL,
                    scheduled_at TEXT,
                    auto_publish INTEGER NOT NULL,
                    status TEXT NOT NULL,
                    next_run_at TEXT,
                    last_run_at TEXT,
                    run_count INTEGER NOT NULL,
                    logo_path TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS automation_runs (
                    id TEXT PRIMARY KEY,
                    job_id TEXT NOT NULL,
                    status TEXT NOT NULL,
                    message TEXT NOT NULL,
                    candidates_json TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY(job_id) REFERENCES automation_jobs(id)
                );
                """
            )
            connection.commit()

    def create_job(
        self,
        *,
        startup_name: str,
        description: str,
        audience: str,
        offer: str,
        tone: str,
        keywords: tuple[str, ...],
        platforms: tuple[str, ...],
        mode: AutomationMode,
        interval_minutes: int,
        scheduled_at: datetime | None,
        auto_publish: bool,
        logo_path: str | None = None,
    ) -> AutomationJob:
        now = _now()
        job = AutomationJob(
            id=str(uuid.uuid4()),
            startup_name=startup_name,
            description=description,
            audience=audience,
            offer=offer,
            tone=tone,
            keywords=keywords or (startup_name,),
            platforms=platforms or ("tiktok", "instagram_reels", "youtube_shorts"),
            mode=mode,
            interval_minutes=max(1, interval_minutes),
            scheduled_at=scheduled_at,
            auto_publish=auto_publish,
            status=AutomationStatus.STOPPED,
            next_run_at=scheduled_at if mode == AutomationMode.SCHEDULED else now,
            last_run_at=None,
            run_count=0,
            logo_path=logo_path,
        )
        with self.connect() as connection:
            connection.execute(
                """
                INSERT INTO automation_jobs (
                    id, startup_name, description, audience, offer, tone,
                    keywords_json, platforms_json, mode, interval_minutes,
                    scheduled_at, auto_publish, status, next_run_at, last_run_at,
                    run_count, logo_path, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    job.id,
                    job.startup_name,
                    job.description,
                    job.audience,
                    job.offer,
                    job.tone,
                    json.dumps(job.keywords),
                    json.dumps(job.platforms),
                    job.mode.value,
                    job.interval_minutes,
                    _dt_to_str(job.scheduled_at),
                    int(job.auto_publish),
                    job.status.value,
                    _dt_to_str(job.next_run_at),
                    None,
                    job.run_count,
                    job.logo_path,
                    _dt_to_str(now),
                    _dt_to_str(now),
                ),
            )
        return job

    def list_jobs(self) -> list[AutomationJob]:
        with self.connect() as connection:
            rows = connection.execute(
                "SELECT * FROM automation_jobs ORDER BY updated_at DESC"
            ).fetchall()
        return [self._row_to_job(row) for row in rows]

    def get_job(self, job_id: str) -> AutomationJob | None:
        with self.connect() as connection:
            row = connection.execute(
                "SELECT * FROM automation_jobs WHERE id = ?",
                (job_id,),
            ).fetchone()
        return self._row_to_job(row) if row else None

    def set_status(self, job_id: str, status: AutomationStatus) -> AutomationJob:
        job = self._require_job(job_id)
        now = _now()
        next_run_at = job.next_run_at
        if status == AutomationStatus.ACTIVE:
            if job.mode == AutomationMode.CONTINUOUS:
                next_run_at = now
            elif job.scheduled_at is not None:
                next_run_at = max(job.scheduled_at, now)
        with self.connect() as connection:
            connection.execute(
                """
                UPDATE automation_jobs
                SET status = ?, next_run_at = ?, updated_at = ?
                WHERE id = ?
                """,
                (status.value, _dt_to_str(next_run_at), _dt_to_str(now), job_id),
            )
            connection.commit()
        updated = self.get_job(job_id)
        if updated is None:
            raise KeyError(job_id)
        return updated

    def due_jobs(self, limit: int = 5) -> list[AutomationJob]:
        now = _dt_to_str(_now())
        with self.connect() as connection:
            rows = connection.execute(
                """
                SELECT * FROM automation_jobs
                WHERE status = ? AND next_run_at IS NOT NULL AND next_run_at <= ?
                ORDER BY next_run_at ASC
                LIMIT ?
                """,
                (AutomationStatus.ACTIVE.value, now, limit),
            ).fetchall()
        return [self._row_to_job(row) for row in rows]

    def record_run(
        self,
        job: AutomationJob,
        *,
        status: str,
        message: str,
        candidates: tuple[str, ...] = (),
    ) -> AutomationRun:
        now = _now()
        run = AutomationRun(
            id=str(uuid.uuid4()),
            job_id=job.id,
            status=status,
            message=message,
            candidates=candidates,
            created_at=now,
        )
        next_run_at, next_status = self._next_state_after_run(job, now, status)
        with self.connect() as connection:
            connection.execute(
                """
                INSERT INTO automation_runs (
                    id, job_id, status, message, candidates_json, created_at
                ) VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    run.id,
                    run.job_id,
                    run.status,
                    run.message,
                    json.dumps(run.candidates),
                    _dt_to_str(run.created_at),
                ),
            )
            connection.execute(
                """
                UPDATE automation_jobs
                SET status = ?, next_run_at = ?, last_run_at = ?, run_count = run_count + 1, updated_at = ?
                WHERE id = ?
                """,
                (
                    next_status.value,
                    _dt_to_str(next_run_at),
                    _dt_to_str(now),
                    _dt_to_str(now),
                    job.id,
                ),
            )
            connection.commit()
        return run

    def list_runs(self, job_id: str | None = None, limit: int = 50) -> list[AutomationRun]:
        query = "SELECT * FROM automation_runs"
        params: list[Any] = []
        if job_id:
            query += " WHERE job_id = ?"
            params.append(job_id)
        query += " ORDER BY created_at DESC LIMIT ?"
        params.append(limit)
        with self.connect() as connection:
            rows = connection.execute(query, params).fetchall()
        return [self._row_to_run(row) for row in rows]

    def _next_state_after_run(
        self,
        job: AutomationJob,
        now: datetime,
        run_status: str,
    ) -> tuple[datetime | None, AutomationStatus]:
        if run_status == "failed":
            return None, AutomationStatus.ERROR
        if job.mode == AutomationMode.SCHEDULED:
            return None, AutomationStatus.COMPLETED
        return now + timedelta(minutes=job.interval_minutes), AutomationStatus.ACTIVE

    def _require_job(self, job_id: str) -> AutomationJob:
        job = self.get_job(job_id)
        if job is None:
            raise KeyError(job_id)
        return job

    def _row_to_job(self, row: sqlite3.Row) -> AutomationJob:
        return AutomationJob(
            id=row["id"],
            startup_name=row["startup_name"],
            description=row["description"],
            audience=row["audience"],
            offer=row["offer"],
            tone=row["tone"],
            keywords=tuple(json.loads(row["keywords_json"])),
            platforms=tuple(json.loads(row["platforms_json"])),
            mode=AutomationMode(row["mode"]),
            interval_minutes=int(row["interval_minutes"]),
            scheduled_at=_dt_from_str(row["scheduled_at"]),
            auto_publish=bool(row["auto_publish"]),
            status=AutomationStatus(row["status"]),
            next_run_at=_dt_from_str(row["next_run_at"]),
            last_run_at=_dt_from_str(row["last_run_at"]),
            run_count=int(row["run_count"]),
            logo_path=row["logo_path"],
        )

    def _row_to_run(self, row: sqlite3.Row) -> AutomationRun:
        return AutomationRun(
            id=row["id"],
            job_id=row["job_id"],
            status=row["status"],
            message=row["message"],
            candidates=tuple(json.loads(row["candidates_json"])),
            created_at=_dt_from_str(row["created_at"]) or _now(),
        )


class AutomationEngine:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.store = AutomationStore(settings.db_path)
        self.pipeline_store = PipelineStore(settings.db_path)
        self.pipeline_store.initialize()
        self.pipeline = ContentPipeline(settings, self.pipeline_store)
        self.generator = StartupCampaignGenerator()

    def run_due_once(self) -> list[AutomationRun]:
        runs: list[AutomationRun] = []
        for job in self.store.due_jobs():
            runs.append(self.run_job(job.id))
        return runs

    def run_job(self, job_id: str) -> AutomationRun:
        job = self.store.get_job(job_id)
        if job is None:
            raise KeyError(job_id)
        try:
            candidates = self._generate_candidates(job)
            if candidates:
                result = self.pipeline.evaluate_candidates(
                    candidates,
                    platforms=job.platforms,
                    require_virality_threshold=False,
                )
                publish_message = self._publish_if_requested(job, candidates)
                message = (
                    f"Generated {len(candidates)} video(s); queued {result.queued}. "
                    f"{publish_message}"
                ).strip()
                return self.store.record_run(
                    job,
                    status="succeeded",
                    message=message,
                    candidates=tuple(candidate.source_id for candidate in candidates),
                )

            plan = self.generator.plan(self._brief_for_job(job))
            request_paths = plan.write_requests(self.settings.generation_requests_dir)
            return self.store.record_run(
                job,
                status="planned",
                message=(
                    "No OPENMONTAGE_WEBHOOK_URL configured. "
                    f"Wrote {len(request_paths)} generation request file(s)."
                ),
            )
        except Exception as exc:
            return self.store.record_run(job, status="failed", message=str(exc))

    def _generate_candidates(self, job: AutomationJob):
        if not self.settings.openmontage_webhook_url:
            return []
        client = OpenMontageClient(self.settings.openmontage_webhook_url)
        return self.generator.generate(self._brief_for_job(job), client)

    def _publish_if_requested(self, job: AutomationJob, candidates) -> str:
        if not job.auto_publish:
            return "Saved to publishing queue."
        if not self.settings.postiz_integration_ids:
            return "Auto-publish requested, but POSTIZ_INTEGRATION_IDS is empty; saved to local publishing queue."

        captioner = TemplateCaptionGenerator()
        publisher = PostizPublisher(
            binary=self.settings.postiz_binary,
            integration_ids=self.settings.postiz_integration_ids,
        )
        published = 0
        drafted = 0
        review_queue = ManualReviewQueue(self.settings.publish_queue_dir)
        for candidate in candidates:
            captions = captioner.generate(candidate)
            job_payload = PublishingJob(
                candidate_id=candidate.source_id,
                media_ref=candidate.media_url or "",
                captions=captions.variants,
                platforms=job.platforms,
                requires_human_approval=self.settings.require_human_approval,
                status="review" if self.settings.require_human_approval else "scheduled",
            )
            if self.settings.require_human_approval:
                review_queue.write(job_payload)
                publisher.publish(job_payload, draft=True)
                drafted += 1
            else:
                publisher.publish(job_payload, draft=False)
                published += 1
        return f"Postiz drafts: {drafted}; scheduled posts: {published}."

    def _brief_for_job(self, job: AutomationJob) -> StartupVideoBrief:
        logo_note = f" Include the startup logo from {job.logo_path} where it fits naturally." if job.logo_path else ""
        return StartupVideoBrief(
            startup_name=job.startup_name,
            description=f"{job.description}{logo_note}",
            audience=job.audience,
            offer=job.offer,
            tone=job.tone,
            keywords=job.keywords,
            duration_seconds=30,
            count=1,
        )


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _dt_to_str(value: datetime | None) -> str | None:
    if value is None:
        return None
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc).isoformat()


def _dt_from_str(value: str | None) -> datetime | None:
    if not value:
        return None
    return datetime.fromisoformat(value.replace("Z", "+00:00"))
