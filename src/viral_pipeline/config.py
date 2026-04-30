from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


def load_env_file(path: Path = Path(".env")) -> None:
    if not path.exists():
        return
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


def _bool_from_env(name: str, default: bool) -> bool:
    value = os.environ.get(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _csv_from_env(name: str) -> set[str]:
    value = os.environ.get(name, "")
    return {item.strip().lower() for item in value.split(",") if item.strip()}


def _csv_tuple_from_env(name: str) -> tuple[str, ...]:
    value = os.environ.get(name, "")
    return tuple(item.strip() for item in value.split(",") if item.strip())


@dataclass(frozen=True)
class Settings:
    db_path: Path = Path("data/pipeline.sqlite3")
    raw_media_dir: Path = Path("media/raw")
    processed_media_dir: Path = Path("media/processed")
    publish_queue_dir: Path = Path("publish_queue")
    generation_requests_dir: Path = Path("generation_requests")
    min_virality_score: float = 2.5
    reddit_user_agent: str = "CompliantContentPipeline/0.1 contact:you@example.com"
    authorized_reddit_authors: frozenset[str] = frozenset()
    openmontage_webhook_url: str | None = None
    veo_webhook_url: str | None = None
    ytdlp_binary: str = "yt-dlp"
    dify_api_url: str | None = None
    dify_api_key: str | None = None
    dify_user: str = "viral_pipeline"
    n8n_webhook_url: str | None = None
    postiz_binary: str = "postiz"
    postiz_integration_ids: tuple[str, ...] = ()
    automation_poll_seconds: int = 15
    automation_min_interval_minutes: int = 15
    require_human_approval: bool = True

    def ensure_directories(self) -> None:
        for path in (
            self.db_path.parent,
            self.raw_media_dir,
            self.processed_media_dir,
            self.publish_queue_dir,
            self.generation_requests_dir,
        ):
            path.mkdir(parents=True, exist_ok=True)


def load_settings() -> Settings:
    load_env_file()
    return Settings(
        db_path=Path(os.environ.get("PIPELINE_DB_PATH", "data/pipeline.sqlite3")),
        raw_media_dir=Path(os.environ.get("RAW_MEDIA_DIR", "media/raw")),
        processed_media_dir=Path(os.environ.get("PROCESSED_MEDIA_DIR", "media/processed")),
        publish_queue_dir=Path(os.environ.get("PUBLISH_QUEUE_DIR", "publish_queue")),
        generation_requests_dir=Path(os.environ.get("GENERATION_REQUESTS_DIR", "generation_requests")),
        min_virality_score=float(os.environ.get("MIN_VIRALITY_SCORE", "2.5")),
        reddit_user_agent=os.environ.get(
            "REDDIT_USER_AGENT",
            "CompliantContentPipeline/0.1 contact:you@example.com",
        ),
        authorized_reddit_authors=frozenset(_csv_from_env("AUTHORIZED_REDDIT_AUTHORS")),
        openmontage_webhook_url=os.environ.get("OPENMONTAGE_WEBHOOK_URL") or None,
        veo_webhook_url=os.environ.get("VEO_WEBHOOK_URL") or None,
        ytdlp_binary=os.environ.get("YTDLP_BINARY", "yt-dlp"),
        dify_api_url=os.environ.get("DIFY_API_URL") or None,
        dify_api_key=os.environ.get("DIFY_API_KEY") or None,
        dify_user=os.environ.get("DIFY_USER", "viral_pipeline"),
        n8n_webhook_url=os.environ.get("N8N_WEBHOOK_URL") or None,
        postiz_binary=os.environ.get("POSTIZ_BINARY", "postiz"),
        postiz_integration_ids=_csv_tuple_from_env("POSTIZ_INTEGRATION_IDS"),
        automation_poll_seconds=int(os.environ.get("AUTOMATION_POLL_SECONDS", "15")),
        automation_min_interval_minutes=int(os.environ.get("AUTOMATION_MIN_INTERVAL_MINUTES", "15")),
        require_human_approval=_bool_from_env("REQUIRE_HUMAN_APPROVAL", True),
    )
