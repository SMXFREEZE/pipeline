from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from viral_pipeline.integrations.http import post_json


@dataclass(frozen=True)
class N8nWebhookClient:
    webhook_url: str

    def dispatch(self, event_type: str, payload: dict[str, Any]) -> dict[str, Any]:
        return post_json(
            self.webhook_url,
            {
                "event_type": event_type,
                "payload": payload,
            },
            timeout=60,
        )


def apify_trend_monitor_payload(
    keywords: list[str],
    max_items: int = 50,
    platforms: tuple[str, ...] = ("reddit", "instagram", "tiktok"),
) -> dict[str, Any]:
    return {
        "keywords": keywords,
        "max_items": max_items,
        "platforms": platforms,
        "required_rights_gate": True,
        "allowed_next_actions": [
            "trend_analysis",
            "caption_inspiration",
            "creator_outreach_review",
        ],
    }
