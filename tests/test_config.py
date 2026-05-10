from __future__ import annotations

import os
import unittest
from unittest.mock import patch

from viral_pipeline.config import Settings, load_settings


class SettingsTests(unittest.TestCase):
    def test_human_approval_is_disabled_by_default(self) -> None:
        with patch.dict(os.environ, {}, clear=False):
            os.environ.pop("REQUIRE_HUMAN_APPROVAL", None)

            self.assertFalse(Settings().require_human_approval)
            self.assertFalse(load_settings().require_human_approval)

    def test_human_approval_can_still_be_enabled(self) -> None:
        with patch.dict(os.environ, {"REQUIRE_HUMAN_APPROVAL": "true"}, clear=False):
            self.assertTrue(load_settings().require_human_approval)


if __name__ == "__main__":
    unittest.main()
