from __future__ import annotations

import json
import subprocess
import tempfile
import unittest
from pathlib import Path

from viral_pipeline.exceptions import ComplianceBlockedError
from viral_pipeline.ingestion.external_json import ExternalJsonIngestor
from viral_pipeline.ingestion.ytdlp import YtDlpClient
from viral_pipeline.integrations.registry import IntegrationStatus, TOOL_REGISTRY
from viral_pipeline.models import CandidateVideo, PublishingJob, RightsStatus
from viral_pipeline.publishing.blocked import BlockedPublisher
from viral_pipeline.publishing.postiz import PostizPublisher
from viral_pipeline.video.clean_room import ProcessingAction, build_clean_room_plan


class IntegrationRegistryTests(unittest.TestCase):
    def test_evasion_tools_are_disabled(self) -> None:
        self.assertEqual(TOOL_REGISTRY["shadowhash"].status, IntegrationStatus.DISABLED)
        self.assertEqual(TOOL_REGISTRY["tiktok_auto_uploader"].status, IntegrationStatus.DISABLED)
        self.assertEqual(TOOL_REGISTRY["true_tiktok_uploader"].status, IntegrationStatus.DISABLED)


class YtDlpTests(unittest.TestCase):
    def test_extract_candidate_maps_ytdlp_json(self) -> None:
        def runner(command, **kwargs):
            return subprocess.CompletedProcess(
                command,
                0,
                stdout=json.dumps(
                    {
                        "id": "abc",
                        "extractor_key": "YouTube",
                        "webpage_url": "https://example.test/watch",
                        "title": "Example",
                        "uploader": "Creator",
                        "view_count": 1000,
                        "like_count": 100,
                        "comment_count": 5,
                        "duration": 12.5,
                    }
                ),
                stderr="",
            )

        candidate = YtDlpClient(runner=runner).extract_candidate(
            "https://example.test/watch",
            rights_status=RightsStatus.LICENSED,
        )

        self.assertEqual(candidate.source_id, "abc")
        self.assertEqual(candidate.source, "youtube")
        self.assertEqual(candidate.rights_status, RightsStatus.LICENSED)
        self.assertEqual(candidate.upvotes, 100)


class ExternalJsonIngestorTests(unittest.TestCase):
    def test_fetch_maps_json_items(self) -> None:
        def runner(command, **kwargs):
            return subprocess.CompletedProcess(
                command,
                0,
                stdout=json.dumps(
                    {
                        "items": [
                            {
                                "id": "one",
                                "url": "https://example.test/one",
                                "title": "One",
                                "likes": 10,
                                "comments": 2,
                                "video_url": "https://cdn.example.test/one.mp4",
                            }
                        ]
                    }
                ),
                stderr="",
            )

        candidates = ExternalJsonIngestor(["social-scraper"], "social_scraper", runner=runner).fetch()

        self.assertEqual(len(candidates), 1)
        self.assertEqual(candidates[0].engagement_count, 12)
        self.assertEqual(candidates[0].media_url, "https://cdn.example.test/one.mp4")


class PublishingIntegrationTests(unittest.TestCase):
    def test_blocked_publisher_raises(self) -> None:
        job = PublishingJob(
            candidate_id="x",
            media_ref="https://cdn.example.test/x.mp4",
            captions=("a", "b", "c"),
            platforms=("tiktok",),
        )

        with self.assertRaises(ComplianceBlockedError):
            BlockedPublisher("ShadowHash", "evasion").publish(job)

    def test_postiz_uploads_local_media_and_creates_draft(self) -> None:
        commands = []

        def runner(command, **kwargs):
            commands.append(command)
            if command[1] == "upload":
                return subprocess.CompletedProcess(command, 0, stdout='{"path":"https://postiz.test/video.mp4"}', stderr="")
            return subprocess.CompletedProcess(command, 0, stdout="created-post-id", stderr="")

        with tempfile.TemporaryDirectory() as temp_dir:
            media = Path(temp_dir) / "video.mp4"
            media.write_bytes(b"fake video")
            job = PublishingJob(
                candidate_id="x",
                media_ref=str(media),
                captions=("caption", "b", "c"),
                platforms=("tiktok",),
            )

            result = PostizPublisher(
                integration_ids=("integration-1",),
                runner=runner,
            ).publish(job)

        self.assertEqual(result, "created-post-id")
        self.assertEqual(commands[0][1], "upload")
        self.assertEqual(commands[1][1], "posts:create")
        self.assertIn("https://postiz.test/video.mp4", commands[1])


class CleanRoomTests(unittest.TestCase):
    def test_watermark_signal_routes_to_review(self) -> None:
        candidate = CandidateVideo(
            source_id="x",
            source="test",
            source_url="https://example.test",
            media_url="https://cdn.example.test/x.mp4",
            title="Repost from @page",
            rights_status=RightsStatus.UNKNOWN,
        )

        plan = build_clean_room_plan(candidate)

        self.assertEqual(plan.action, ProcessingAction.REVIEW)
        self.assertFalse(plan.remove_distribution_watermarks)
        self.assertFalse(plan.mutate_hash_for_evasion)


if __name__ == "__main__":
    unittest.main()
