from __future__ import annotations

from typing import Protocol

from viral_pipeline.models import CandidateVideo


class Ingestor(Protocol):
    def fetch(self) -> list[CandidateVideo]:
        """Fetch candidate videos from a source."""
