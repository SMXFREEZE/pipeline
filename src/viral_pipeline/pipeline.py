from __future__ import annotations

from dataclasses import dataclass

from viral_pipeline.captions import TemplateCaptionGenerator
from viral_pipeline.config import Settings
from viral_pipeline.db import PipelineStore
from viral_pipeline.models import CandidateVideo, PipelineStage, PublishingJob
from viral_pipeline.publishing.manual_queue import ManualReviewQueue
from viral_pipeline.rights import assess_rights
from viral_pipeline.scoring import calculate_virality_score, is_viral_enough


@dataclass(frozen=True)
class PipelineResult:
    discovered: int = 0
    below_threshold: int = 0
    approved: int = 0
    review_required: int = 0
    rejected: int = 0
    queued: int = 0


class ContentPipeline:
    def __init__(
        self,
        settings: Settings,
        store: PipelineStore,
        captioner: TemplateCaptionGenerator | None = None,
        review_queue: ManualReviewQueue | None = None,
    ) -> None:
        self.settings = settings
        self.store = store
        self.captioner = captioner or TemplateCaptionGenerator()
        self.review_queue = review_queue or ManualReviewQueue(settings.publish_queue_dir)

    def evaluate_candidates(
        self,
        candidates: list[CandidateVideo],
        platforms: tuple[str, ...] = ("tiktok", "instagram_reels", "youtube_shorts"),
        require_virality_threshold: bool = True,
    ) -> PipelineResult:
        result = PipelineResult(discovered=len(candidates))
        counters = result.__dict__.copy()

        for candidate in candidates:
            score = calculate_virality_score(candidate)
            if require_virality_threshold and not is_viral_enough(candidate, self.settings.min_virality_score):
                self.store.upsert_candidate(candidate, score, PipelineStage.DISCOVERED)
                counters["below_threshold"] += 1
                continue

            decision = assess_rights(candidate, self.settings.authorized_reddit_authors)
            if decision.approved:
                self.store.upsert_candidate(candidate, score, PipelineStage.APPROVED)
                counters["approved"] += 1
                job = self._create_review_job(candidate, candidate.media_url or "", platforms)
                self.review_queue.write(job)
                self.store.enqueue_publishing_job(
                    candidate,
                    job.media_ref,
                    job.captions,
                    job.platforms,
                    job.requires_human_approval,
                )
                counters["queued"] += 1
                continue

            stage = PipelineStage.QUEUED_FOR_REVIEW if decision.review_required else PipelineStage.REJECTED
            self.store.upsert_candidate(candidate, score, stage)
            if decision.review_required:
                counters["review_required"] += 1
            else:
                counters["rejected"] += 1

        return PipelineResult(**counters)

    def _create_review_job(
        self,
        candidate: CandidateVideo,
        media_ref: str,
        platforms: tuple[str, ...],
    ) -> PublishingJob:
        captions = self.captioner.generate(candidate)
        return PublishingJob(
            candidate_id=candidate.source_id,
            media_ref=media_ref,
            captions=captions.variants,
            platforms=platforms,
            requires_human_approval=self.settings.require_human_approval,
        )
