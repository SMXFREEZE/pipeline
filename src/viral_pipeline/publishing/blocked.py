from __future__ import annotations

from dataclasses import dataclass

from viral_pipeline.exceptions import ComplianceBlockedError
from viral_pipeline.models import PublishingJob


@dataclass(frozen=True)
class BlockedPublisher:
    name: str
    reason: str

    def publish(self, job: PublishingJob) -> str:
        raise ComplianceBlockedError(f"{self.name} is disabled for this pipeline: {self.reason}")
