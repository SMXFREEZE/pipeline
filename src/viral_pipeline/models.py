from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from pathlib import Path
from typing import Any


class RightsStatus(str, Enum):
    OWNED = "owned"
    LICENSED = "licensed"
    PUBLIC_DOMAIN = "public_domain"
    CREATIVE_COMMONS = "creative_commons"
    UNKNOWN = "unknown"
    REVIEW_REQUIRED = "review_required"
    REJECTED = "rejected"


class PipelineStage(str, Enum):
    DISCOVERED = "discovered"
    APPROVED = "approved"
    REJECTED = "rejected"
    DOWNLOADED = "downloaded"
    PROCESSED = "processed"
    QUEUED_FOR_REVIEW = "queued_for_review"
    QUEUED_FOR_PUBLISHING = "queued_for_publishing"
    PUBLISHED = "published"


@dataclass(frozen=True)
class CandidateVideo:
    source_id: str
    source: str
    source_url: str
    title: str
    author: str | None = None
    media_url: str | None = None
    created_at: datetime | None = None
    views: int | None = None
    upvotes: int = 0
    comments: int = 0
    shares: int = 0
    duration_seconds: float | None = None
    rights_status: RightsStatus = RightsStatus.UNKNOWN
    license_name: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)

    @property
    def engagement_count(self) -> int:
        return max(0, self.upvotes) + max(0, self.comments) + max(0, self.shares)

    @property
    def age_hours(self) -> float | None:
        if self.created_at is None:
            return None
        created_at = self.created_at
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)
        age = datetime.now(timezone.utc) - created_at.astimezone(timezone.utc)
        return max(age.total_seconds() / 3600, 1 / 60)


@dataclass(frozen=True)
class ComplianceDecision:
    approved: bool
    status: RightsStatus
    reason: str
    review_required: bool = False


@dataclass(frozen=True)
class ProcessedAsset:
    candidate_id: str
    source_url: str
    input_path: Path
    output_path: Path
    fingerprint: str
    duration_seconds: float | None = None


@dataclass(frozen=True)
class CaptionSet:
    candidate_id: str
    variants: tuple[str, str, str]


@dataclass(frozen=True)
class PublishingJob:
    candidate_id: str
    media_ref: str
    captions: tuple[str, str, str]
    platforms: tuple[str, ...]
    requires_human_approval: bool = True
    status: str = "review"
