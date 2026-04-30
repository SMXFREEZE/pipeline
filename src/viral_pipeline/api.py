from __future__ import annotations

import threading
from pathlib import Path

from viral_pipeline.automation import (
    AutomationEngine,
    AutomationMode,
    AutomationStatus,
    AutomationStore,
)
from viral_pipeline.config import load_settings
from viral_pipeline.db import PipelineStore
from viral_pipeline.ingestion.reddit import RedditJsonIngestor
from viral_pipeline.integrations.registry import list_integrations
from viral_pipeline.pipeline import ContentPipeline

try:
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.staticfiles import StaticFiles
except ModuleNotFoundError as exc:  # pragma: no cover
    raise RuntimeError(
        "FastAPI is not installed. Install API dependencies with: pip install -e \".[api]\""
    ) from exc


app = FastAPI(title="Compliant Viral Video Pipeline", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
_scheduler_stop = threading.Event()
_scheduler_thread: threading.Thread | None = None


def _automation_loop() -> None:
    settings = load_settings()
    engine = AutomationEngine(settings)
    while not _scheduler_stop.wait(settings.automation_poll_seconds):
        engine.run_due_once()


@app.on_event("startup")
def start_automation_scheduler() -> None:
    global _scheduler_thread
    if _scheduler_thread and _scheduler_thread.is_alive():
        return
    _scheduler_stop.clear()
    _scheduler_thread = threading.Thread(
        target=_automation_loop,
        name="viral-pipeline-automation",
        daemon=True,
    )
    _scheduler_thread.start()


@app.on_event("shutdown")
def stop_automation_scheduler() -> None:
    _scheduler_stop.set()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/candidates")
def candidates(limit: int = 25) -> list[dict]:
    settings = load_settings()
    store = PipelineStore(settings.db_path)
    store.initialize()
    return [dict(row) for row in store.list_candidates(limit)]


@app.get("/integrations")
def integrations() -> list[dict]:
    return list_integrations()


@app.get("/automation/jobs")
def automation_jobs() -> list[dict]:
    settings = load_settings()
    store = AutomationStore(settings.db_path)
    return [job.to_dict() for job in store.list_jobs()]


@app.post("/automation/jobs")
def create_automation_job(payload: dict) -> dict:
    settings = load_settings()
    settings.ensure_directories()
    store = AutomationStore(settings.db_path)
    interval = max(
        int(payload.get("interval_minutes") or settings.automation_min_interval_minutes),
        settings.automation_min_interval_minutes,
    )
    mode = AutomationMode(payload.get("mode", AutomationMode.CONTINUOUS.value))
    scheduled_at = _parse_datetime(payload.get("scheduled_at"))
    job = store.create_job(
        startup_name=payload["startup_name"],
        description=payload["description"],
        audience=payload.get("audience", "startup buyers"),
        offer=payload.get("offer", ""),
        tone=payload.get("tone", "clear, energetic, trustworthy"),
        keywords=tuple(payload.get("keywords") or [payload["startup_name"]]),
        platforms=tuple(payload.get("platforms") or ["tiktok", "instagram_reels", "youtube_shorts"]),
        mode=mode,
        interval_minutes=interval,
        scheduled_at=scheduled_at,
        auto_publish=bool(payload.get("auto_publish", False)),
        logo_path=payload.get("logo_path") or None,
    )
    if payload.get("start", False):
        job = store.set_status(job.id, AutomationStatus.ACTIVE)
    return job.to_dict()


@app.post("/automation/jobs/{job_id}/start")
def start_automation_job(job_id: str) -> dict:
    settings = load_settings()
    job = AutomationStore(settings.db_path).set_status(job_id, AutomationStatus.ACTIVE)
    return job.to_dict()


@app.post("/automation/jobs/{job_id}/stop")
def stop_automation_job(job_id: str) -> dict:
    settings = load_settings()
    job = AutomationStore(settings.db_path).set_status(job_id, AutomationStatus.STOPPED)
    return job.to_dict()


@app.post("/automation/jobs/{job_id}/run-now")
def run_automation_job_now(job_id: str) -> dict:
    settings = load_settings()
    run = AutomationEngine(settings).run_job(job_id)
    return run.to_dict()


@app.get("/automation/runs")
def automation_runs(job_id: str | None = None, limit: int = 50) -> list[dict]:
    settings = load_settings()
    runs = AutomationStore(settings.db_path).list_runs(job_id=job_id, limit=limit)
    return [run.to_dict() for run in runs]


@app.post("/ingest/reddit/{subreddit}")
def ingest_reddit(subreddit: str, limit: int = 25) -> dict:
    settings = load_settings()
    settings.ensure_directories()
    store = PipelineStore(settings.db_path)
    store.initialize()
    ingestor = RedditJsonIngestor(
        subreddit=subreddit,
        user_agent=settings.reddit_user_agent,
        limit=limit,
        authorized_authors=settings.authorized_reddit_authors,
    )
    result = ContentPipeline(settings, store).evaluate_candidates(ingestor.fetch())
    return result.__dict__


def _parse_datetime(value: str | None):
    if not value:
        return None
    from datetime import datetime

    return datetime.fromisoformat(value.replace("Z", "+00:00"))


_studio_path = Path(__file__).resolve().parents[2] / "web"
if _studio_path.exists():
    app.mount("/studio", StaticFiles(directory=_studio_path, html=True), name="studio")
