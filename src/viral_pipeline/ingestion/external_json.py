from __future__ import annotations

import json
import subprocess
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Callable, Sequence

from viral_pipeline.exceptions import ExternalToolError
from viral_pipeline.models import CandidateVideo, RightsStatus

CompletedProcessRunner = Callable[..., subprocess.CompletedProcess[str]]


@dataclass(frozen=True)
class ExternalJsonIngestor:
    """Adapter for cloned tools that can emit candidate JSON to stdout.

    Expected input shape is a list of objects with at least `id` or `source_id`,
    `url` or `source_url`, and `title`. Extra fields are preserved in metadata.
    """

    command: Sequence[str]
    source: str
    default_rights: RightsStatus = RightsStatus.UNKNOWN
    runner: CompletedProcessRunner = subprocess.run

    def fetch(self) -> list[CandidateVideo]:
        try:
            process = self.runner(
                list(self.command),
                check=True,
                capture_output=True,
                text=True,
            )
        except FileNotFoundError as exc:
            raise ExternalToolError(f"External command was not found: {self.command[0]}") from exc
        except subprocess.CalledProcessError as exc:
            raise ExternalToolError(f"External command failed: {(exc.stderr or '').strip()}") from exc

        try:
            payload = json.loads(process.stdout)
        except json.JSONDecodeError as exc:
            raise ExternalToolError("External command did not emit JSON.") from exc

        if isinstance(payload, dict):
            items = payload.get("items") or payload.get("results") or []
        else:
            items = payload
        if not isinstance(items, list):
            raise ExternalToolError("External command JSON must be a list or contain items/results.")

        return [self._candidate_from_item(item) for item in items if isinstance(item, dict)]

    def _candidate_from_item(self, item: dict) -> CandidateVideo:
        created_at = item.get("created_at") or item.get("timestamp")
        parsed_created_at = None
        if isinstance(created_at, str):
            try:
                parsed_created_at = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
            except ValueError:
                parsed_created_at = None
        elif isinstance(created_at, (int, float)):
            parsed_created_at = datetime.fromtimestamp(created_at, timezone.utc)

        return CandidateVideo(
            source_id=str(item.get("source_id") or item.get("id") or item.get("url") or ""),
            source=self.source,
            source_url=str(item.get("source_url") or item.get("url") or ""),
            title=str(item.get("title") or item.get("text") or "Untitled candidate"),
            author=item.get("author") or item.get("username"),
            media_url=item.get("media_url") or item.get("video_url") or item.get("download_url"),
            created_at=parsed_created_at,
            views=_optional_int(item.get("views") or item.get("view_count")),
            upvotes=int(item.get("upvotes") or item.get("likes") or item.get("score") or 0),
            comments=int(item.get("comments") or item.get("comment_count") or 0),
            shares=int(item.get("shares") or item.get("share_count") or 0),
            duration_seconds=_optional_float(item.get("duration_seconds") or item.get("duration")),
            rights_status=self.default_rights,
            license_name=item.get("license"),
            metadata={key: value for key, value in item.items() if key not in _KNOWN_KEYS},
        )


def _optional_int(value: object) -> int | None:
    if value is None:
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _optional_float(value: object) -> float | None:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


_KNOWN_KEYS = {
    "source_id",
    "id",
    "source_url",
    "url",
    "title",
    "text",
    "author",
    "username",
    "media_url",
    "video_url",
    "download_url",
    "created_at",
    "timestamp",
    "views",
    "view_count",
    "upvotes",
    "likes",
    "score",
    "comments",
    "comment_count",
    "shares",
    "share_count",
    "duration_seconds",
    "duration",
    "license",
}
