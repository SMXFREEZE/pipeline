from __future__ import annotations

import json
import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Callable, Sequence

from viral_pipeline.exceptions import ExternalToolError
from viral_pipeline.models import CandidateVideo, RightsStatus

CompletedProcessRunner = Callable[..., subprocess.CompletedProcess[str]]


@dataclass(frozen=True)
class YtDlpClient:
    binary: str = "yt-dlp"
    runner: CompletedProcessRunner = subprocess.run

    def extract_candidate(
        self,
        url: str,
        rights_status: RightsStatus = RightsStatus.UNKNOWN,
        license_name: str | None = None,
    ) -> CandidateVideo:
        info = self._run_json(
            [
                self.binary,
                "--dump-single-json",
                "--no-playlist",
                "--no-warnings",
                url,
            ]
        )
        return candidate_from_ytdlp_info(info, rights_status, license_name)

    def download(
        self,
        url: str,
        output_dir: Path,
        filename_template: str = "%(extractor_key)s-%(id)s.%(ext)s",
    ) -> Path:
        output_dir.mkdir(parents=True, exist_ok=True)
        command = [
            self.binary,
            "--no-playlist",
            "--no-progress",
            "--paths",
            str(output_dir),
            "-o",
            filename_template,
            "--print",
            "after_move:filepath",
            "-f",
            "bv*+ba/best",
            "--merge-output-format",
            "mp4",
            url,
        ]
        process = self._run(command)
        lines = [line.strip() for line in process.stdout.splitlines() if line.strip()]
        if not lines:
            raise ExternalToolError("yt-dlp did not report a downloaded file path.")
        return Path(lines[-1])

    def _run_json(self, command: Sequence[str]) -> dict:
        process = self._run(command)
        try:
            return json.loads(process.stdout)
        except json.JSONDecodeError as exc:
            raise ExternalToolError(f"yt-dlp returned non-JSON output: {process.stdout[:200]}") from exc

    def _run(self, command: Sequence[str]) -> subprocess.CompletedProcess[str]:
        try:
            return self.runner(command, check=True, capture_output=True, text=True)
        except FileNotFoundError as exc:
            raise ExternalToolError("yt-dlp was not found. Install it or set YTDLP_BINARY.") from exc
        except subprocess.CalledProcessError as exc:
            stderr = exc.stderr or ""
            raise ExternalToolError(f"yt-dlp failed: {stderr.strip()}") from exc


def candidate_from_ytdlp_info(
    info: dict,
    rights_status: RightsStatus,
    license_name: str | None,
) -> CandidateVideo:
    source_id = str(info.get("id") or info.get("display_id") or info.get("webpage_url") or "")
    source_url = str(info.get("webpage_url") or info.get("original_url") or "")
    title = str(info.get("title") or "Untitled video")
    author = info.get("uploader") or info.get("channel") or info.get("creator")
    media_url = info.get("url") or source_url
    duration = info.get("duration")
    view_count = info.get("view_count")
    like_count = int(info.get("like_count") or 0)
    comment_count = int(info.get("comment_count") or 0)

    return CandidateVideo(
        source_id=source_id,
        source=str(info.get("extractor_key") or info.get("extractor") or "yt_dlp").lower(),
        source_url=source_url,
        title=title,
        author=str(author) if author else None,
        media_url=str(media_url) if media_url else None,
        views=int(view_count) if view_count is not None else None,
        upvotes=like_count,
        comments=comment_count,
        shares=0,
        duration_seconds=float(duration) if duration is not None else None,
        rights_status=rights_status,
        license_name=license_name,
        metadata={
            "extractor": info.get("extractor"),
            "extractor_key": info.get("extractor_key"),
            "license": info.get("license"),
            "availability": info.get("availability"),
        },
    )
