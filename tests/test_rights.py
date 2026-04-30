from __future__ import annotations

import unittest

from viral_pipeline.models import CandidateVideo, RightsStatus
from viral_pipeline.rights import assess_rights


class RightsTests(unittest.TestCase):
    def test_owned_candidate_is_approved(self) -> None:
        candidate = CandidateVideo(
            source_id="owned-1",
            source="upload",
            source_url="https://example.test/source",
            media_url="https://cdn.example.test/video.mp4",
            title="Original clip",
            rights_status=RightsStatus.OWNED,
        )

        decision = assess_rights(candidate)

        self.assertTrue(decision.approved)
        self.assertEqual(decision.status, RightsStatus.OWNED)


    def test_unknown_watermarked_candidate_requires_review(self) -> None:
        candidate = CandidateVideo(
            source_id="third-party-1",
            source="reddit",
            source_url="https://reddit.example/video",
            media_url="https://cdn.example.test/video.mp4",
            title="Compilation from @somepage",
            rights_status=RightsStatus.UNKNOWN,
        )

        decision = assess_rights(candidate)

        self.assertFalse(decision.approved)
        self.assertTrue(decision.review_required)


    def test_allowlisted_author_is_approved_as_licensed(self) -> None:
        candidate = CandidateVideo(
            source_id="allow-1",
            source="reddit",
            source_url="https://reddit.example/video",
            media_url="https://cdn.example.test/video.mp4",
            title="Approved source",
            author="PartnerCreator",
            rights_status=RightsStatus.UNKNOWN,
        )

        decision = assess_rights(candidate, authorized_authors={"partnercreator"})

        self.assertTrue(decision.approved)
        self.assertEqual(decision.status, RightsStatus.LICENSED)


if __name__ == "__main__":
    unittest.main()
