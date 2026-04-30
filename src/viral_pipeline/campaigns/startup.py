from __future__ import annotations

import json
import re
from dataclasses import asdict, dataclass
from datetime import datetime
from pathlib import Path

from viral_pipeline.models import CandidateVideo
from viral_pipeline.orchestration.openmontage import OpenMontageClient


@dataclass(frozen=True)
class StartupVideoBrief:
    startup_name: str
    description: str
    audience: str
    offer: str
    tone: str
    keywords: tuple[str, ...]
    duration_seconds: int = 30
    count: int = 3


@dataclass(frozen=True)
class StartupVideoRequest:
    keyword: str
    angle: str
    prompt: str
    duration_seconds: int


@dataclass(frozen=True)
class StartupCampaignPlan:
    brief: StartupVideoBrief
    requests: tuple[StartupVideoRequest, ...]

    def write_requests(self, output_dir: Path) -> list[Path]:
        output_dir.mkdir(parents=True, exist_ok=True)
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        safe_name = _safe_filename(self.brief.startup_name)
        written: list[Path] = []
        for index, request in enumerate(self.requests, start=1):
            path = output_dir / f"{timestamp}-{safe_name}-{index}.json"
            payload = {
                "startup": asdict(self.brief),
                "request": asdict(request),
                "expected_response": {
                    "source_id": "unique-id",
                    "media_url": "https://.../final.mp4 or local path",
                    "title": "video title",
                    "duration_seconds": request.duration_seconds,
                    "license_name": "original",
                },
            }
            path.write_text(json.dumps(payload, indent=2, sort_keys=True), encoding="utf-8")
            written.append(path)
        return written


class StartupCampaignGenerator:
    def plan(self, brief: StartupVideoBrief) -> StartupCampaignPlan:
        requests = []
        keywords = brief.keywords or (brief.startup_name,)
        angles = _angles_for_count(brief.count)
        for index in range(brief.count):
            keyword = keywords[index % len(keywords)]
            angle = angles[index % len(angles)]
            requests.append(
                StartupVideoRequest(
                    keyword=keyword,
                    angle=angle,
                    prompt=_build_prompt(brief, keyword, angle),
                    duration_seconds=brief.duration_seconds,
                )
            )
        return StartupCampaignPlan(brief=brief, requests=tuple(requests))

    def generate(self, brief: StartupVideoBrief, client: OpenMontageClient) -> list[CandidateVideo]:
        plan = self.plan(brief)
        return [
            client.create_original_video(
                keyword=request.keyword,
                brief=request.prompt,
                duration_seconds=request.duration_seconds,
            )
            for request in plan.requests
        ]


def _angles_for_count(count: int) -> tuple[str, ...]:
    base = (
        "problem-solution hook",
        "founder insight",
        "customer before-and-after",
        "myth-busting educational clip",
        "quick product walkthrough",
        "social proof and objection handling",
    )
    return base[: max(1, min(count, len(base)))] or base[:1]


def _build_prompt(brief: StartupVideoBrief, keyword: str, angle: str) -> str:
    offer = brief.offer or "the core product value"
    return (
        f"Create an original {brief.duration_seconds}-second vertical short for {brief.startup_name}. "
        f"Startup description: {brief.description}. "
        f"Target audience: {brief.audience}. "
        f"Video angle: {angle}. "
        f"Keyword/theme: {keyword}. "
        f"Primary offer or call to action: {offer}. "
        f"Tone: {brief.tone}. "
        "Use only original, licensed, or royalty-free assets. "
        "Do not imitate a specific living creator. "
        "Return a finished MP4 media URL or local render path plus title and audit metadata."
    )


def _safe_filename(value: str) -> str:
    safe = re.sub(r"[^A-Za-z0-9_.-]+", "-", value).strip("-")
    return safe or "startup"
