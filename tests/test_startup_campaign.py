from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from viral_pipeline.campaigns.startup import StartupCampaignGenerator, StartupVideoBrief


class StartupCampaignTests(unittest.TestCase):
    def test_plan_writes_generation_requests(self) -> None:
        brief = StartupVideoBrief(
            startup_name="AcmeAI",
            description="AI support assistant for small teams",
            audience="founders",
            offer="start a free trial",
            tone="sharp and helpful",
            keywords=("support automation", "customer experience"),
            duration_seconds=25,
            count=2,
        )

        plan = StartupCampaignGenerator().plan(brief)

        self.assertEqual(len(plan.requests), 2)
        self.assertIn("AcmeAI", plan.requests[0].prompt)
        self.assertIn("original", plan.requests[0].prompt.lower())

        with tempfile.TemporaryDirectory() as temp_dir:
            paths = plan.write_requests(Path(temp_dir))

        self.assertEqual(len(paths), 2)


if __name__ == "__main__":
    unittest.main()
