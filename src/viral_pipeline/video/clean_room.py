from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from viral_pipeline.models import CandidateVideo
from viral_pipeline.rights import has_distribution_watermark_signal


class ProcessingAction(str, Enum):
    PROCESS = "process"
    REVIEW = "review"
    REJECT = "reject"


@dataclass(frozen=True)
class CleanRoomPlan:
    action: ProcessingAction
    reason: str
    preserve_branding: bool = True
    remove_distribution_watermarks: bool = False
    mutate_hash_for_evasion: bool = False


def build_clean_room_plan(candidate: CandidateVideo) -> CleanRoomPlan:
    if has_distribution_watermark_signal(candidate):
        return CleanRoomPlan(
            action=ProcessingAction.REVIEW,
            reason=(
                "Potential creator handle or platform watermark detected. "
                "Do not remove attribution; verify rights or reject."
            ),
        )

    if candidate.rights_status.value in {"unknown", "review_required", "rejected"}:
        return CleanRoomPlan(
            action=ProcessingAction.REVIEW,
            reason="Rights are not approved yet.",
        )

    return CleanRoomPlan(
        action=ProcessingAction.PROCESS,
        reason="Content is approved for standard transcoding and privacy metadata cleanup.",
    )
