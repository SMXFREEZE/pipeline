from __future__ import annotations

import subprocess
from dataclasses import dataclass
from pathlib import Path

from viral_pipeline.video.fingerprint import file_sha256


@dataclass(frozen=True)
class FfmpegProcessor:
    ffmpeg_binary: str = "ffmpeg"
    width: int = 1080
    height: int = 1920

    def process_vertical_short(self, input_path: Path, output_path: Path) -> str:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        video_filter = (
            f"scale=w={self.width}:h={self.height}:force_original_aspect_ratio=decrease,"
            f"pad={self.width}:{self.height}:(ow-iw)/2:(oh-ih)/2:black,"
            "setsar=1"
        )
        command = [
            self.ffmpeg_binary,
            "-y",
            "-i",
            str(input_path),
            "-vf",
            video_filter,
            "-c:v",
            "libx264",
            "-preset",
            "medium",
            "-crf",
            "20",
            "-c:a",
            "aac",
            "-b:a",
            "160k",
            "-movflags",
            "+faststart",
            "-map_metadata",
            "-1",
            str(output_path),
        ]
        subprocess.run(command, check=True)
        return file_sha256(output_path)
