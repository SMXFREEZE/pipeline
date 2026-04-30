from __future__ import annotations

import argparse
import json
import time
from dataclasses import replace
from pathlib import Path

from viral_pipeline.automation import AutomationEngine, AutomationMode, AutomationStatus, AutomationStore
from viral_pipeline.campaigns.startup import StartupCampaignGenerator, StartupVideoBrief
from viral_pipeline.config import load_settings
from viral_pipeline.db import PipelineStore
from viral_pipeline.ingestion.reddit import RedditJsonIngestor
from viral_pipeline.ingestion.ytdlp import YtDlpClient
from viral_pipeline.integrations.registry import list_integrations
from viral_pipeline.models import PublishingJob, RightsStatus
from viral_pipeline.orchestration.dify import DifyWorkflowClient
from viral_pipeline.orchestration.n8n import N8nWebhookClient, apify_trend_monitor_payload
from viral_pipeline.orchestration.openmontage import OpenMontageClient
from viral_pipeline.pipeline import ContentPipeline
from viral_pipeline.publishing.postiz import PostizPublisher


def main() -> None:
    parser = argparse.ArgumentParser(prog="viral-pipeline")
    subparsers = parser.add_subparsers(dest="command", required=True)

    subparsers.add_parser("init-db", help="Create or migrate the local SQLite database.")
    subparsers.add_parser("tools", help="List configured external tool integrations.")

    reddit = subparsers.add_parser("ingest-reddit", help="Fetch Reddit candidates and evaluate them.")
    reddit.add_argument("subreddits", nargs="+")
    reddit.add_argument("--limit", type=int, default=25)

    url = subparsers.add_parser("ingest-url", help="Extract one authorized URL with yt-dlp metadata.")
    url.add_argument("url")
    url.add_argument(
        "--rights",
        choices=[status.value for status in RightsStatus],
        default=RightsStatus.UNKNOWN.value,
    )
    url.add_argument("--license-name")
    url.add_argument("--download", action="store_true")

    n8n = subparsers.add_parser("dispatch-n8n", help="Send a trend monitor request to an n8n webhook.")
    n8n.add_argument("keywords", nargs="+")
    n8n.add_argument("--max-items", type=int, default=50)

    startup = subparsers.add_parser(
        "generate-startup",
        help="Generate original startup videos and queue them for review/publishing.",
    )
    startup.add_argument("--startup-name", required=True)
    startup.add_argument("--description", required=True)
    startup.add_argument("--audience", default="startup buyers")
    startup.add_argument("--offer", default="")
    startup.add_argument("--tone", default="clear, energetic, trustworthy")
    startup.add_argument("--keywords", nargs="*", default=[])
    startup.add_argument("--count", type=int, default=3)
    startup.add_argument("--duration", type=int, default=30)
    startup.add_argument(
        "--platforms",
        default="tiktok,instagram_reels,youtube_shorts",
        help="Comma-separated platform labels for the publishing queue.",
    )
    startup.add_argument(
        "--plan-only",
        action="store_true",
        help="Write generation request JSON files instead of calling OpenMontage.",
    )

    dify = subparsers.add_parser("run-dify", help="Run a Dify workflow with JSON inputs.")
    dify.add_argument("--inputs-json", required=True, help="JSON string or path to a JSON file.")
    dify.add_argument("--workflow-id")

    postiz = subparsers.add_parser("publish-postiz", help="Create a Postiz draft from a queue job JSON file.")
    postiz.add_argument("job_file", type=Path)
    postiz.add_argument("--caption-index", type=int, default=0)
    postiz.add_argument("--schedule-at", help="ISO datetime. Defaults to now.")
    postiz.add_argument("--schedule", action="store_true", help="Schedule instead of leaving as draft.")

    auto = subparsers.add_parser("automation-create", help="Create a recurring or scheduled startup video job.")
    auto.add_argument("--startup-name", required=True)
    auto.add_argument("--description", required=True)
    auto.add_argument("--audience", default="startup buyers")
    auto.add_argument("--offer", default="")
    auto.add_argument("--tone", default="clear, energetic, trustworthy")
    auto.add_argument("--keywords", nargs="*", default=[])
    auto.add_argument("--platforms", default="tiktok,instagram_reels,youtube_shorts")
    auto.add_argument("--mode", choices=[mode.value for mode in AutomationMode], default=AutomationMode.CONTINUOUS.value)
    auto.add_argument("--interval-minutes", type=int, default=30)
    auto.add_argument("--scheduled-at")
    auto.add_argument("--logo-path")
    auto.add_argument("--auto-publish", action="store_true")
    auto.add_argument("--start", action="store_true")

    subparsers.add_parser("automation-list", help="List automation jobs.")

    auto_start = subparsers.add_parser("automation-start", help="Start an automation job.")
    auto_start.add_argument("job_id")

    auto_stop = subparsers.add_parser("automation-stop", help="Stop an automation job.")
    auto_stop.add_argument("job_id")

    auto_run = subparsers.add_parser("automation-run-now", help="Run an automation job immediately.")
    auto_run.add_argument("job_id")

    worker = subparsers.add_parser("automation-worker", help="Run the automation scheduler loop.")
    worker.add_argument("--poll-seconds", type=int)

    listed = subparsers.add_parser("list-candidates", help="List recent candidates.")
    listed.add_argument("--limit", type=int, default=25)

    args = parser.parse_args()
    settings = load_settings()
    settings.ensure_directories()
    store = PipelineStore(settings.db_path)
    store.initialize()

    if args.command == "init-db":
        print(json.dumps({"db_path": str(settings.db_path), "status": "initialized"}))
        return

    if args.command == "tools":
        print(json.dumps(list_integrations(), indent=2))
        return

    if args.command == "list-candidates":
        print(json.dumps([dict(row) for row in store.list_candidates(args.limit)], indent=2))
        return

    if args.command == "ingest-url":
        candidate = YtDlpClient(binary=settings.ytdlp_binary).extract_candidate(
            args.url,
            rights_status=RightsStatus(args.rights),
            license_name=args.license_name,
        )
        if args.download:
            media_path = YtDlpClient(binary=settings.ytdlp_binary).download(
                args.url,
                settings.raw_media_dir,
            )
            candidate = replace(candidate, media_url=str(media_path))
        result = ContentPipeline(settings, store).evaluate_candidates([candidate])
        print(json.dumps({"candidate": candidate.source_id, "result": result.__dict__}, indent=2))
        return

    if args.command == "dispatch-n8n":
        if not settings.n8n_webhook_url:
            raise SystemExit("N8N_WEBHOOK_URL is required.")
        payload = apify_trend_monitor_payload(args.keywords, max_items=args.max_items)
        result = N8nWebhookClient(settings.n8n_webhook_url).dispatch("trend_monitor.requested", payload)
        print(json.dumps(result, indent=2))
        return

    if args.command == "generate-startup":
        brief = StartupVideoBrief(
            startup_name=args.startup_name,
            description=args.description,
            audience=args.audience,
            offer=args.offer,
            tone=args.tone,
            keywords=tuple(args.keywords) or (args.startup_name,),
            duration_seconds=args.duration,
            count=args.count,
        )
        generator = StartupCampaignGenerator()
        if args.plan_only:
            plan = generator.plan(brief)
            written = plan.write_requests(settings.generation_requests_dir)
            print(json.dumps({"status": "planned", "request_files": [str(path) for path in written]}, indent=2))
            return

        if not settings.openmontage_webhook_url:
            raise SystemExit("OPENMONTAGE_WEBHOOK_URL is required, or use --plan-only.")

        candidates = generator.generate(brief, OpenMontageClient(settings.openmontage_webhook_url))
        platforms = tuple(item.strip() for item in args.platforms.split(",") if item.strip())
        result = ContentPipeline(settings, store).evaluate_candidates(
            candidates,
            platforms=platforms,
            require_virality_threshold=False,
        )
        print(
            json.dumps(
                {
                    "status": "generated",
                    "candidates": [candidate.source_id for candidate in candidates],
                    "result": result.__dict__,
                },
                indent=2,
            )
        )
        return

    if args.command == "run-dify":
        if not settings.dify_api_url or not settings.dify_api_key:
            raise SystemExit("DIFY_API_URL and DIFY_API_KEY are required.")
        inputs = _read_json_argument(args.inputs_json)
        result = DifyWorkflowClient(
            settings.dify_api_url,
            settings.dify_api_key,
            user=settings.dify_user,
        ).run_workflow(inputs, workflow_id=args.workflow_id)
        print(json.dumps(result, indent=2))
        return

    if args.command == "publish-postiz":
        job = _read_publishing_job(args.job_file)
        scheduled_at = _parse_datetime(args.schedule_at) if args.schedule_at else None
        result = PostizPublisher(
            binary=settings.postiz_binary,
            integration_ids=settings.postiz_integration_ids,
        ).publish(
            job,
            scheduled_at=scheduled_at,
            caption_index=args.caption_index,
            draft=not args.schedule,
        )
        print(result)
        return

    if args.command == "automation-create":
        automation_store = AutomationStore(settings.db_path)
        interval = max(args.interval_minutes, settings.automation_min_interval_minutes)
        job = automation_store.create_job(
            startup_name=args.startup_name,
            description=args.description,
            audience=args.audience,
            offer=args.offer,
            tone=args.tone,
            keywords=tuple(args.keywords) or (args.startup_name,),
            platforms=tuple(item.strip() for item in args.platforms.split(",") if item.strip()),
            mode=AutomationMode(args.mode),
            interval_minutes=interval,
            scheduled_at=_parse_datetime(args.scheduled_at) if args.scheduled_at else None,
            auto_publish=args.auto_publish,
            logo_path=args.logo_path,
        )
        if args.start:
            job = automation_store.set_status(job.id, AutomationStatus.ACTIVE)
        print(json.dumps(job.to_dict(), indent=2))
        return

    if args.command == "automation-list":
        jobs = AutomationStore(settings.db_path).list_jobs()
        print(json.dumps([job.to_dict() for job in jobs], indent=2))
        return

    if args.command == "automation-start":
        job = AutomationStore(settings.db_path).set_status(args.job_id, AutomationStatus.ACTIVE)
        print(json.dumps(job.to_dict(), indent=2))
        return

    if args.command == "automation-stop":
        job = AutomationStore(settings.db_path).set_status(args.job_id, AutomationStatus.STOPPED)
        print(json.dumps(job.to_dict(), indent=2))
        return

    if args.command == "automation-run-now":
        run = AutomationEngine(settings).run_job(args.job_id)
        print(json.dumps(run.to_dict(), indent=2))
        return

    if args.command == "automation-worker":
        engine = AutomationEngine(settings)
        poll_seconds = args.poll_seconds or settings.automation_poll_seconds
        print(json.dumps({"status": "running", "poll_seconds": poll_seconds}))
        while True:
            runs = engine.run_due_once()
            for run in runs:
                print(json.dumps(run.to_dict()))
            time.sleep(poll_seconds)

    if args.command == "ingest-reddit":
        pipeline = ContentPipeline(settings, store)
        totals: dict[str, int] = {
            "discovered": 0,
            "below_threshold": 0,
            "approved": 0,
            "review_required": 0,
            "rejected": 0,
            "queued": 0,
        }
        for subreddit in args.subreddits:
            ingestor = RedditJsonIngestor(
                subreddit=subreddit,
                user_agent=settings.reddit_user_agent,
                limit=args.limit,
                authorized_authors=settings.authorized_reddit_authors,
            )
            result = pipeline.evaluate_candidates(ingestor.fetch())
            for key, value in result.__dict__.items():
                totals[key] += value
        print(json.dumps(totals, indent=2))
        return

    raise SystemExit(f"Unknown command: {args.command}")


def _read_json_argument(value: str) -> dict:
    if value.lstrip().startswith("{"):
        return json.loads(value)
    path = Path(value)
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    return json.loads(value)


def _read_publishing_job(path: Path) -> PublishingJob:
    payload = json.loads(path.read_text(encoding="utf-8"))
    return PublishingJob(
        candidate_id=payload["candidate_id"],
        media_ref=payload["media_ref"],
        captions=tuple(payload["captions"]),
        platforms=tuple(payload["platforms"]),
        requires_human_approval=bool(payload.get("requires_human_approval", True)),
        status=payload.get("status", "review"),
    )


def _parse_datetime(value: str):
    from datetime import datetime

    return datetime.fromisoformat(value.replace("Z", "+00:00"))


if __name__ == "__main__":
    main()
