from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

from viral_pipeline.integrations.http import post_json
from viral_pipeline.models import CandidateVideo, RightsStatus


@dataclass(frozen=True)
class OpenMontageClient:
    webhook_url: str

    def create_original_video(self, keyword: str, brief: str, duration_seconds: int = 60) -> CandidateVideo:
        result = post_json(
            self.webhook_url,
            {
                "keyword": keyword,
                "brief": brief,
                "duration_seconds": duration_seconds,
                "rights_required": "original_or_licensed",
                "delivery_format": "vertical_short",
            },
            timeout=120,
        )
        return candidate_from_generation_result(result, keyword, brief)


def candidate_from_generation_result(result: dict[str, Any], keyword: str, brief: str) -> CandidateVideo:
    return CandidateVideo(
        source_id=str(result["source_id"]),
        source="openmontage",
        source_url=str(result.get("source_url") or result.get("project_url") or ""),
        title=str(result.get("title") or f"Original video for {keyword}"),
        author=str(result.get("author") or "openmontage"),
        media_url=str(result["media_url"]),
        created_at=datetime.now(timezone.utc),
        views=0,
        upvotes=0,
        comments=0,
        shares=0,
        duration_seconds=_optional_float(result.get("duration_seconds")),
        rights_status=RightsStatus.OWNED,
        license_name=str(result.get("license_name") or "original"),
        metadata={
            "keyword": keyword,
            "brief": brief,
            "provider": result.get("provider", "openmontage"),
            "audit_log_url": result.get("audit_log_url"),
        },
    )


def _optional_float(value: object) -> float | None:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None
