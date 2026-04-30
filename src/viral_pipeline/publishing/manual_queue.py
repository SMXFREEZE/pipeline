from __future__ import annotations

import json
from dataclasses import asdict
from datetime import datetime
from pathlib import Path

from viral_pipeline.models import PublishingJob


class ManualReviewQueue:
    def __init__(self, queue_dir: Path) -> None:
        self.queue_dir = queue_dir
        self.queue_dir.mkdir(parents=True, exist_ok=True)

    def write(self, job: PublishingJob) -> Path:
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        path = self.queue_dir / f"{timestamp}-{job.candidate_id}.json"
        payload = asdict(job)
        path.write_text(json.dumps(payload, indent=2, sort_keys=True), encoding="utf-8")
        return path
