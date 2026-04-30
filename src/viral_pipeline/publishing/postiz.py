from __future__ import annotations

import json
import subprocess
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable, Sequence

from viral_pipeline.exceptions import ExternalToolError
from viral_pipeline.models import PublishingJob

CompletedProcessRunner = Callable[..., subprocess.CompletedProcess[str]]


@dataclass(frozen=True)
class PostizPublisher:
    binary: str = "postiz"
    integration_ids: tuple[str, ...] = ()
    runner: CompletedProcessRunner = subprocess.run

    def publish(
        self,
        job: PublishingJob,
        scheduled_at: datetime | None = None,
        caption_index: int = 0,
        draft: bool = True,
    ) -> str:
        if not self.integration_ids:
            raise ExternalToolError("Postiz integration IDs are required.")

        schedule = scheduled_at or datetime.now(timezone.utc)
        media_ref = self._postiz_media_ref(job.media_ref)
        command = [
            self.binary,
            "posts:create",
            "-c",
            job.captions[caption_index],
            "-s",
            schedule.astimezone(timezone.utc).isoformat().replace("+00:00", "Z"),
            "-t",
            "draft" if draft else "schedule",
            "-i",
            ",".join(self.integration_ids),
            "-m",
            media_ref,
        ]
        process = self._run(command)
        return process.stdout.strip()

    def _postiz_media_ref(self, media_ref: str) -> str:
        path = Path(media_ref)
        if not path.exists():
            return media_ref
        process = self._run([self.binary, "upload", str(path)])
        try:
            payload = json.loads(process.stdout)
        except json.JSONDecodeError as exc:
            raise ExternalToolError(f"Postiz upload returned non-JSON output: {process.stdout[:200]}") from exc
        uploaded = payload.get("path") or payload.get("url")
        if not uploaded:
            raise ExternalToolError("Postiz upload did not return a path or url.")
        return str(uploaded)

    def _run(self, command: Sequence[str]) -> subprocess.CompletedProcess[str]:
        try:
            return self.runner(list(command), check=True, capture_output=True, text=True)
        except FileNotFoundError as exc:
            raise ExternalToolError("postiz was not found. Install it with: npm install -g postiz") from exc
        except subprocess.CalledProcessError as exc:
            raise ExternalToolError(f"postiz failed: {(exc.stderr or '').strip()}") from exc
