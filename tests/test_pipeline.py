from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from viral_pipeline.config import Settings
from viral_pipeline.db import PipelineStore
from viral_pipeline.models import CandidateVideo, RightsStatus
from viral_pipeline.pipeline import ContentPipeline


class PipelineTests(unittest.TestCase):
    def test_pipeline_queues_only_approved_candidates(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            tmp_path = Path(temp_dir)
            settings = Settings(
                db_path=tmp_path / "pipeline.sqlite3",
                publish_queue_dir=tmp_path / "queue",
                min_virality_score=0.1,
            )
            settings.ensure_directories()
            store = PipelineStore(settings.db_path)
            store.initialize()
            pipeline = ContentPipeline(settings, store)

            result = pipeline.evaluate_candidates(
                [
                    CandidateVideo(
                        source_id="approved",
                        source="test",
                        source_url="https://example.test/approved",
                        media_url="https://cdn.example.test/approved.mp4",
                        title="Approved",
                        upvotes=100,
                        comments=20,
                        rights_status=RightsStatus.OWNED,
                    ),
                    CandidateVideo(
                        source_id="review",
                        source="test",
                        source_url="https://example.test/review",
                        media_url="https://cdn.example.test/review.mp4",
                        title="Repost from @unknown",
                        upvotes=100,
                        comments=20,
                        rights_status=RightsStatus.UNKNOWN,
                    ),
                ]
            )

            self.assertEqual(result.queued, 1)
            self.assertEqual(result.review_required, 1)
            self.assertEqual(len(list((tmp_path / "queue").glob("*.json"))), 1)

    def test_pipeline_can_bypass_virality_for_original_generation(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            tmp_path = Path(temp_dir)
            settings = Settings(
                db_path=tmp_path / "pipeline.sqlite3",
                publish_queue_dir=tmp_path / "queue",
                min_virality_score=999,
            )
            settings.ensure_directories()
            store = PipelineStore(settings.db_path)
            store.initialize()

            result = ContentPipeline(settings, store).evaluate_candidates(
                [
                    CandidateVideo(
                        source_id="generated",
                        source="openmontage",
                        source_url="https://example.test/project",
                        media_url="https://cdn.example.test/generated.mp4",
                        title="Generated startup clip",
                        rights_status=RightsStatus.OWNED,
                    )
                ],
                require_virality_threshold=False,
            )

            self.assertEqual(result.approved, 1)
            self.assertEqual(result.queued, 1)
            self.assertEqual(result.below_threshold, 0)


if __name__ == "__main__":
    unittest.main()
