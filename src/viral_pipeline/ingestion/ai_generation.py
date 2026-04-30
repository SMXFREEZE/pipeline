from __future__ import annotations

import json
import urllib.request
from dataclasses import dataclass
from datetime import datetime, timezone

from viral_pipeline.models import CandidateVideo, RightsStatus


@dataclass(frozen=True)
class GeneratedVideoRequest:
    keyword: str
    brief: str
    webhook_url: str


class AiGenerationHook:
    """Webhook adapter for original AI-generated clips.

    The remote service is expected to return JSON with source_id, source_url,
    media_url, title, and optional duration_seconds.
    """

    def create(self, request: GeneratedVideoRequest) -> CandidateVideo:
        payload = json.dumps(
            {
                "keyword": request.keyword,
                "brief": request.brief,
                "format": "vertical_short",
                "rights_required": "original_or_licensed",
            }
        ).encode("utf-8")
        http_request = urllib.request.Request(
            request.webhook_url,
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(http_request, timeout=60) as response:
            result = json.loads(response.read().decode("utf-8"))

        return CandidateVideo(
            source_id=result["source_id"],
            source="ai_generation",
            source_url=result.get("source_url", request.webhook_url),
            title=result.get("title", f"AI video for {request.keyword}"),
            author=result.get("author", "internal-ai-generation"),
            media_url=result["media_url"],
            created_at=datetime.now(timezone.utc),
            views=0,
            upvotes=0,
            comments=0,
            shares=0,
            duration_seconds=result.get("duration_seconds"),
            rights_status=RightsStatus.OWNED,
            license_name="original",
            metadata={
                "keyword": request.keyword,
                "brief": request.brief,
                "provider": result.get("provider", "webhook"),
            },
        )
