from __future__ import annotations

import re
from collections.abc import Iterable

from viral_pipeline.models import CandidateVideo, ComplianceDecision, RightsStatus


APPROVABLE_RIGHTS = {
    RightsStatus.OWNED,
    RightsStatus.LICENSED,
    RightsStatus.PUBLIC_DOMAIN,
    RightsStatus.CREATIVE_COMMONS,
}

DISTRIBUTION_WATERMARK_PATTERNS = (
    re.compile(r"\btiktok\b", re.IGNORECASE),
    re.compile(r"\binstagram\b|\big\b|\breels\b", re.IGNORECASE),
    re.compile(r"\byoutube\b|\bshorts\b", re.IGNORECASE),
    re.compile(r"@\w{2,}", re.IGNORECASE),
)


def has_distribution_watermark_signal(candidate: CandidateVideo) -> bool:
    text = " ".join(
        str(value)
        for value in (
            candidate.title,
            candidate.author,
            candidate.source_url,
            candidate.media_url,
            candidate.metadata.get("watermark_text"),
            candidate.metadata.get("detected_overlay_text"),
        )
        if value
    )
    return any(pattern.search(text) for pattern in DISTRIBUTION_WATERMARK_PATTERNS)


def assess_rights(
    candidate: CandidateVideo,
    authorized_authors: Iterable[str] = (),
) -> ComplianceDecision:
    authorized = {author.lower() for author in authorized_authors}
    author = (candidate.author or "").lower()

    if candidate.media_url is None:
        return ComplianceDecision(
            approved=False,
            status=RightsStatus.REJECTED,
            reason="Candidate has no downloadable media URL.",
        )

    if candidate.rights_status in APPROVABLE_RIGHTS:
        return ComplianceDecision(
            approved=True,
            status=candidate.rights_status,
            reason=f"Rights status is {candidate.rights_status.value}.",
        )

    if author and author in authorized:
        return ComplianceDecision(
            approved=True,
            status=RightsStatus.LICENSED,
            reason="Author is present in the configured authorization allowlist.",
        )

    if has_distribution_watermark_signal(candidate):
        return ComplianceDecision(
            approved=False,
            status=RightsStatus.REVIEW_REQUIRED,
            reason=(
                "Potential distribution watermark or repost signal detected. "
                "Route to review instead of removing attribution."
            ),
            review_required=True,
        )

    return ComplianceDecision(
        approved=False,
        status=RightsStatus.REVIEW_REQUIRED,
        reason="Rights are unknown. Explicit approval or license evidence is required.",
        review_required=True,
    )
