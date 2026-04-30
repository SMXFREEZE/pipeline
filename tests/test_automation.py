from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from viral_pipeline.automation import (
    AutomationEngine,
    AutomationMode,
    AutomationStatus,
    AutomationStore,
)
from viral_pipeline.config import Settings


class AutomationTests(unittest.TestCase):
    def test_create_start_stop_job(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            settings = Settings(db_path=Path(temp_dir) / "pipeline.sqlite3")
            store = AutomationStore(settings.db_path)

            job = store.create_job(
                startup_name="AcmeAI",
                description="AI support assistant",
                audience="founders",
                offer="start trial",
                tone="clear",
                keywords=("support",),
                platforms=("tiktok",),
                mode=AutomationMode.CONTINUOUS,
                interval_minutes=15,
                scheduled_at=None,
                auto_publish=False,
            )

            self.assertEqual(job.status, AutomationStatus.STOPPED)
            active = store.set_status(job.id, AutomationStatus.ACTIVE)
            self.assertEqual(active.status, AutomationStatus.ACTIVE)
            stopped = store.set_status(job.id, AutomationStatus.STOPPED)
            self.assertEqual(stopped.status, AutomationStatus.STOPPED)

    def test_engine_plans_when_generator_is_not_configured(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            settings = Settings(
                db_path=root / "pipeline.sqlite3",
                generation_requests_dir=root / "generation_requests",
                publish_queue_dir=root / "publish_queue",
            )
            settings.ensure_directories()
            store = AutomationStore(settings.db_path)
            job = store.create_job(
                startup_name="AcmeAI",
                description="AI support assistant",
                audience="founders",
                offer="start trial",
                tone="clear",
                keywords=("support",),
                platforms=("tiktok",),
                mode=AutomationMode.SCHEDULED,
                interval_minutes=15,
                scheduled_at=None,
                auto_publish=False,
            )

            run = AutomationEngine(settings).run_job(job.id)

            self.assertEqual(run.status, "planned")
            self.assertEqual(len(list((root / "generation_requests").glob("*.json"))), 1)


if __name__ == "__main__":
    unittest.main()
