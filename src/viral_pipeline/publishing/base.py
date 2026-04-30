from __future__ import annotations

from typing import Protocol

from viral_pipeline.models import PublishingJob


class Publisher(Protocol):
    def publish(self, job: PublishingJob) -> str:
        """Publish a reviewed job and return a platform post URL or job ID."""
