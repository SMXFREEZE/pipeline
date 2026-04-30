from __future__ import annotations

import json
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from datetime import datetime, timezone

from viral_pipeline.models import CandidateVideo, RightsStatus


@dataclass(frozen=True)
class RedditJsonIngestor:
    subreddit: str
    user_agent: str
    limit: int = 25
    sort: str = "top"
    time_filter: str = "day"
    authorized_authors: frozenset[str] = frozenset()

    def fetch(self) -> list[CandidateVideo]:
        url = self._url()
        request = urllib.request.Request(
            url,
            headers={
                "User-Agent": self.user_agent,
                "Accept": "application/json",
            },
        )
        try:
            with urllib.request.urlopen(request, timeout=20) as response:
                payload = json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            raise RuntimeError(f"Reddit request failed with HTTP {exc.code}") from exc
        except urllib.error.URLError as exc:
            raise RuntimeError(f"Reddit request failed: {exc.reason}") from exc

        candidates: list[CandidateVideo] = []
        for child in payload.get("data", {}).get("children", []):
            item = child.get("data", {})
            media_url = self._media_url(item)
            if media_url is None:
                continue

            author = item.get("author")
            rights_status = (
                RightsStatus.LICENSED
                if author and author.lower() in self.authorized_authors
                else RightsStatus.UNKNOWN
            )
            created_at = datetime.fromtimestamp(
                item.get("created_utc", time.time()),
                tz=timezone.utc,
            )
            candidates.append(
                CandidateVideo(
                    source_id=item.get("id", ""),
                    source="reddit",
                    source_url="https://www.reddit.com" + item.get("permalink", ""),
                    title=item.get("title", "").strip(),
                    author=author,
                    media_url=media_url,
                    created_at=created_at,
                    views=item.get("view_count"),
                    upvotes=int(item.get("ups") or 0),
                    comments=int(item.get("num_comments") or 0),
                    shares=0,
                    duration_seconds=self._duration_seconds(item),
                    rights_status=rights_status,
                    metadata={
                        "subreddit": self.subreddit,
                        "over_18": bool(item.get("over_18")),
                        "spoiler": bool(item.get("spoiler")),
                        "is_original_content": bool(item.get("is_original_content")),
                    },
                )
            )
        return candidates

    def _url(self) -> str:
        subreddit = urllib.parse.quote(self.subreddit.strip("/"))
        query = urllib.parse.urlencode({"t": self.time_filter, "limit": self.limit})
        return f"https://www.reddit.com/r/{subreddit}/{self.sort}.json?{query}"

    @staticmethod
    def _media_url(item: dict) -> str | None:
        secure_media = item.get("secure_media") or {}
        reddit_video = secure_media.get("reddit_video") or {}
        fallback_url = reddit_video.get("fallback_url")
        if fallback_url:
            return fallback_url.split("?")[0]
        if item.get("post_hint") == "hosted:video" and item.get("url_overridden_by_dest"):
            return item["url_overridden_by_dest"]
        return None

    @staticmethod
    def _duration_seconds(item: dict) -> float | None:
        secure_media = item.get("secure_media") or {}
        reddit_video = secure_media.get("reddit_video") or {}
        duration = reddit_video.get("duration")
        return float(duration) if duration is not None else None
