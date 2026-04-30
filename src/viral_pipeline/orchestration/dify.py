from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from viral_pipeline.integrations.http import post_json


@dataclass(frozen=True)
class DifyWorkflowClient:
    api_base_url: str
    api_key: str
    user: str = "viral_pipeline"

    def run_workflow(
        self,
        inputs: dict[str, Any],
        workflow_id: str | None = None,
        response_mode: str = "blocking",
    ) -> dict[str, Any]:
        base = self.api_base_url.rstrip("/")
        if workflow_id:
            url = f"{base}/workflows/{workflow_id}/run"
        else:
            url = f"{base}/workflows/run"
        return post_json(
            url,
            {
                "inputs": inputs,
                "response_mode": response_mode,
                "user": self.user,
            },
            headers={"Authorization": f"Bearer {self.api_key}"},
            timeout=100,
        )
