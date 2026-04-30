from __future__ import annotations

import json
import sqlite3
from collections.abc import Iterable
from contextlib import contextmanager
from dataclasses import asdict
from datetime import datetime
from pathlib import Path
from typing import Iterator

from viral_pipeline.models import CandidateVideo, PipelineStage, RightsStatus


class PipelineStore:
    def __init__(self, db_path: Path) -> None:
        self.db_path = db_path
        self.db_path.parent.mkdir(parents=True, exist_ok=True)

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
                CREATE TABLE IF NOT EXISTS candidates (
                    source_id TEXT NOT NULL,
                    source TEXT NOT NULL,
                    source_url TEXT NOT NULL,
                    title TEXT NOT NULL,
                    author TEXT,
                    media_url TEXT,
                    created_at TEXT,
                    views INTEGER,
                    upvotes INTEGER NOT NULL,
                    comments INTEGER NOT NULL,
                    shares INTEGER NOT NULL,
                    duration_seconds REAL,
                    rights_status TEXT NOT NULL,
                    license_name TEXT,
                    metadata_json TEXT NOT NULL,
                    virality_score REAL NOT NULL,
                    stage TEXT NOT NULL,
                    created_record_at TEXT NOT NULL,
                    updated_record_at TEXT NOT NULL,
                    PRIMARY KEY (source, source_id)
                );

                CREATE TABLE IF NOT EXISTS fingerprints (
                    fingerprint TEXT PRIMARY KEY,
                    source TEXT NOT NULL,
                    source_id TEXT NOT NULL,
                    output_path TEXT NOT NULL,
                    created_record_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS publishing_jobs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    source TEXT NOT NULL,
                    source_id TEXT NOT NULL,
                    media_ref TEXT NOT NULL,
                    captions_json TEXT NOT NULL,
                    platforms_json TEXT NOT NULL,
                    status TEXT NOT NULL,
                    requires_human_approval INTEGER NOT NULL,
                    created_record_at TEXT NOT NULL
                );
                """
            )

    def candidate_exists(self, candidate: CandidateVideo) -> bool:
        with self.connect() as connection:
            row = connection.execute(
                "SELECT 1 FROM candidates WHERE source = ? AND source_id = ?",
                (candidate.source, candidate.source_id),
            ).fetchone()
            return row is not None

    def upsert_candidate(
        self,
        candidate: CandidateVideo,
        virality_score: float,
        stage: PipelineStage,
    ) -> None:
        now = datetime.utcnow().isoformat(timespec="seconds")
        payload = asdict(candidate)
        metadata_json = json.dumps(payload["metadata"], sort_keys=True)
        created_at = candidate.created_at.isoformat() if candidate.created_at else None

        with self.connect() as connection:
            connection.execute(
                """
                INSERT INTO candidates (
                    source_id, source, source_url, title, author, media_url,
                    created_at, views, upvotes, comments, shares, duration_seconds,
                    rights_status, license_name, metadata_json, virality_score,
                    stage, created_record_at, updated_record_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(source, source_id) DO UPDATE SET
                    source_url = excluded.source_url,
                    title = excluded.title,
                    author = excluded.author,
                    media_url = excluded.media_url,
                    created_at = excluded.created_at,
                    views = excluded.views,
                    upvotes = excluded.upvotes,
                    comments = excluded.comments,
                    shares = excluded.shares,
                    duration_seconds = excluded.duration_seconds,
                    rights_status = excluded.rights_status,
                    license_name = excluded.license_name,
                    metadata_json = excluded.metadata_json,
                    virality_score = excluded.virality_score,
                    stage = excluded.stage,
                    updated_record_at = excluded.updated_record_at
                """,
                (
                    candidate.source_id,
                    candidate.source,
                    candidate.source_url,
                    candidate.title,
                    candidate.author,
                    candidate.media_url,
                    created_at,
                    candidate.views,
                    candidate.upvotes,
                    candidate.comments,
                    candidate.shares,
                    candidate.duration_seconds,
                    candidate.rights_status.value,
                    candidate.license_name,
                    metadata_json,
                    virality_score,
                    stage.value,
                    now,
                    now,
                ),
            )

    def record_fingerprint(
        self,
        fingerprint: str,
        candidate: CandidateVideo,
        output_path: Path,
    ) -> bool:
        now = datetime.utcnow().isoformat(timespec="seconds")
        with self.connect() as connection:
            try:
                connection.execute(
                    """
                    INSERT INTO fingerprints (
                        fingerprint, source, source_id, output_path, created_record_at
                    ) VALUES (?, ?, ?, ?, ?)
                    """,
                    (
                        fingerprint,
                        candidate.source,
                        candidate.source_id,
                        str(output_path),
                        now,
                    ),
                )
            except sqlite3.IntegrityError:
                return False
        return True

    def enqueue_publishing_job(
        self,
        candidate: CandidateVideo,
        media_ref: str,
        captions: Iterable[str],
        platforms: Iterable[str],
        requires_human_approval: bool,
    ) -> None:
        now = datetime.utcnow().isoformat(timespec="seconds")
        with self.connect() as connection:
            connection.execute(
                """
                INSERT INTO publishing_jobs (
                    source, source_id, media_ref, captions_json, platforms_json,
                    status, requires_human_approval, created_record_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    candidate.source,
                    candidate.source_id,
                    media_ref,
                    json.dumps(tuple(captions)),
                    json.dumps(tuple(platforms)),
                    "review" if requires_human_approval else "ready",
                    int(requires_human_approval),
                    now,
                ),
            )

    def list_candidates(self, limit: int = 25) -> list[sqlite3.Row]:
        with self.connect() as connection:
            return list(
                connection.execute(
                    """
                    SELECT source, source_id, title, author, virality_score, stage, rights_status
                    FROM candidates
                    ORDER BY updated_record_at DESC
                    LIMIT ?
                    """,
                    (limit,),
                ).fetchall()
            )


def rights_status_from_db(value: str) -> RightsStatus:
    try:
        return RightsStatus(value)
    except ValueError:
        return RightsStatus.UNKNOWN
