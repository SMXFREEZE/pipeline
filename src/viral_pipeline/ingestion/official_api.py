from __future__ import annotations

from dataclasses import dataclass

from viral_pipeline.models import CandidateVideo


@dataclass(frozen=True)
class OfficialApiIngestor:
    """Placeholder for terms-compliant platform APIs.

    Implement concrete clients for X, TikTok, Instagram, YouTube, or vendors
    only when you have credentials and permission to use the relevant API.
    """

    platform: str

    def fetch(self) -> list[CandidateVideo]:
        raise NotImplementedError(
            f"{self.platform} ingestion requires an approved official API adapter."
        )
