from __future__ import annotations

import re

from viral_pipeline.models import CandidateVideo, CaptionSet


HASHTAG_RE = re.compile(r"[^a-z0-9]+")


def _hashtag(text: str) -> str:
    normalized = HASHTAG_RE.sub("", text.lower())
    return f"#{normalized[:32]}" if normalized else "#video"


class TemplateCaptionGenerator:
    def generate(self, candidate: CandidateVideo) -> CaptionSet:
        title = candidate.title.strip().rstrip(".")
        source = candidate.metadata.get("subreddit") or candidate.source
        keyword_tag = _hashtag(source)
        variants = (
            f"{title}. Thoughts? {keyword_tag}",
            f"This is why {source} is impossible to scroll past. {keyword_tag}",
            f"One of today's standout clips: {title}. {keyword_tag}",
        )
        return CaptionSet(candidate_id=candidate.source_id, variants=variants)
