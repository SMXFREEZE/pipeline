from __future__ import annotations

import math

from viral_pipeline.models import CandidateVideo


def calculate_virality_score(candidate: CandidateVideo) -> float:
    """Score a candidate using engagement density and recency.

    The score is intentionally explainable so operators can tune thresholds
    without treating the recommender as a black box.
    """
    engagement = candidate.engagement_count
    views = max(candidate.views or engagement or 1, 1)
    engagement_ratio = engagement / views
    engagement_volume = math.log1p(engagement)

    age_hours = candidate.age_hours
    recency_multiplier = 1.0
    if age_hours is not None:
        recency_multiplier = 1.0 / math.sqrt(max(age_hours / 24, 0.25))

    return round(((engagement_ratio * 100) + engagement_volume) * recency_multiplier, 4)


def is_viral_enough(candidate: CandidateVideo, threshold: float) -> bool:
    return calculate_virality_score(candidate) >= threshold
