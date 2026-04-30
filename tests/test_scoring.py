from __future__ import annotations

import unittest
from datetime import datetime, timedelta, timezone

from viral_pipeline.models import CandidateVideo
from viral_pipeline.scoring import calculate_virality_score, is_viral_enough


class ScoringTests(unittest.TestCase):
    def test_virality_score_increases_with_engagement(self) -> None:
        old = CandidateVideo(
            source_id="a",
            source="test",
            source_url="https://example.test/a",
            title="A",
            views=10_000,
            upvotes=100,
            comments=10,
            created_at=datetime.now(timezone.utc) - timedelta(hours=2),
        )
        hot = CandidateVideo(
            source_id="b",
            source="test",
            source_url="https://example.test/b",
            title="B",
            views=10_000,
            upvotes=1_000,
            comments=250,
            created_at=datetime.now(timezone.utc) - timedelta(hours=2),
        )

        self.assertGreater(calculate_virality_score(hot), calculate_virality_score(old))
        self.assertTrue(is_viral_enough(hot, threshold=2.5))


if __name__ == "__main__":
    unittest.main()
