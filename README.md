# Viral Video Pipeline

This project scaffolds a multi-stage agentic pipeline for collecting, processing, captioning, and distributing short-form video content while staying inside rights, platform, and account-safety boundaries.

It includes real integration adapters for the usable tools in your list: `yt-dlp`, OpenMontage-style generation hooks, Dify workflow execution, n8n webhook dispatch, Social-Scraper-style JSON imports, and Postiz CLI publishing.

It does **not** implement watermark removal, hash mutation to avoid reused-content classifiers, stealth login automation, proxy rotation, private API abuse, or reposting third-party videos without authorization. Those tools are represented in the integration registry as disabled adapters so the pipeline is explicit about what was requested and why it will not run.

## Architecture

1. **Ingestion**
   - Reddit adapter for trend discovery.
   - `yt-dlp` adapter for authorized URL metadata extraction and downloads.
   - Generic JSON command adapter for cloned tools such as Social-Scraper or local AI generators.
   - AI generation webhook hook for original content.
   - Official API placeholder for X or other networks.
   - Virality scoring based on engagement, views, and recency.

2. **Compliance gate**
   - Requires owned, licensed, public-domain, Creative Commons, or allowlisted sources.
   - Rejects or queues review for unknown rights, platform watermarks, repost signals, and missing media.
   - Stores dedupe fingerprints to avoid repeat posts.

3. **Video processing**
   - FFmpeg transcodes source clips into platform-ready vertical video.
   - Metadata is standardized for privacy and consistency, not to evade content classifiers.
   - The processor preserves creator attribution and does not remove distribution watermarks from third-party media.
   - Clean-room policy routes possible watermarks or unknown rights to review.

4. **Captioning**
   - Generates three caption variants from the source context.
   - Includes a deterministic fallback and leaves room for an LLM provider.

5. **Publishing**
   - Creates reviewable publishing jobs for TikTok, Instagram Reels, Shorts, or a scheduler.
   - Postiz CLI adapter can upload media and create drafts/scheduled posts.
   - Production uploaders should use official APIs or approved scheduling tools.
   - Human approval is enabled by default.

## Implemented Tool Matrix

| Tool | Status | Implementation |
| --- | --- | --- |
| OpenMontage | Enabled | `viral_pipeline.orchestration.openmontage.OpenMontageClient` webhook client for original/licensed generation |
| TikTokAIVideoGenerator | Review-only | Generic JSON command hook for original generated clips after manual dependency review |
| Dify | Enabled | `viral_pipeline.orchestration.dify.DifyWorkflowClient` for `/workflows/run` |
| XActions | Disabled | No-API-key X browser automation is not executed |
| Social-Scraper | Review-only | `viral_pipeline.ingestion.external_json.ExternalJsonIngestor` for JSON output |
| yt-dlp | Enabled | `viral_pipeline.ingestion.ytdlp.YtDlpClient` for authorized media only |
| n8n + Apify workflow | Enabled | `viral_pipeline.orchestration.n8n.N8nWebhookClient` |
| TikTokAutoUploader | Disabled | Stealth/headless upload automation is not executed |
| True-Tiktok-Uploader | Disabled | Private browser-cookie upload bypass is not executed |
| Postiz Agents CLI | Enabled | `viral_pipeline.publishing.postiz.PostizPublisher` |
| instagrapi | Disabled | Private Instagram API automation is not executed |
| ShadowHash | Disabled | Hash/metadata mutation for classifier evasion is not executed |
| taktik-bot | Disabled | Device-based engagement automation is not executed |
| Instagram-Auto-Outreach-Engine | Disabled | Simulated human browsing/outreach automation is not executed |
| n8n | Enabled | Webhook orchestration client |

## Quick Start

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e .
python -m viral_pipeline.cli init-db
python -m viral_pipeline.cli ingest-reddit funny nextfuckinglevel --limit 10
python -m viral_pipeline.cli tools
```

Optional installs:

```powershell
pip install -e ".[download]"
npm install -g postiz
postiz auth:login
```

Extract an authorized URL through `yt-dlp`:

```powershell
python -m viral_pipeline.cli ingest-url "https://example.com/video" --rights licensed --license-name "creator agreement"
```

Dispatch a trend request to n8n:

```powershell
python -m viral_pipeline.cli dispatch-n8n "ai video" "street food" --max-items 50
```

Run a Dify workflow:

```powershell
python -m viral_pipeline.cli run-dify --inputs-json '{"topic":"street food","platform":"reels"}'
```

Create a Postiz draft from a review queue job:

```powershell
python -m viral_pipeline.cli publish-postiz publish_queue\20260430010101-example.json
```

Generate original videos for your startup:

```powershell
python -m viral_pipeline.cli generate-startup `
  --startup-name "AcmeAI" `
  --description "AI support assistant for small teams" `
  --audience "bootstrapped founders and support leads" `
  --offer "start a free trial" `
  --keywords "customer support automation" "reduce support backlog" `
  --count 3 `
  --duration 30
```

That command calls `OPENMONTAGE_WEBHOOK_URL`, treats the returned media as original owned content, skips the virality threshold, generates caption variants, and writes review jobs into `publish_queue/`.

If you have not connected a generator yet, create generation request files instead:

```powershell
python -m viral_pipeline.cli generate-startup `
  --startup-name "AcmeAI" `
  --description "AI support assistant for small teams" `
  --plan-only
```

After review, publish a queued job through Postiz:

```powershell
python -m viral_pipeline.cli publish-postiz publish_queue\JOB_FILE.json --schedule
```

Create a continuous automation job from the CLI:

```powershell
python -m viral_pipeline.cli automation-create `
  --startup-name "AcmeAI" `
  --description "AI support assistant for small teams" `
  --audience "bootstrapped founders and support leads" `
  --offer "start a free trial" `
  --keywords "customer support automation" "reduce support backlog" `
  --mode continuous `
  --interval-minutes 30 `
  --start
```

Run the scheduler loop without FastAPI:

```powershell
python -m viral_pipeline.cli automation-worker
```

Stop a job:

```powershell
python -m viral_pipeline.cli automation-stop JOB_ID
```

For the FastAPI server:

```powershell
pip install -e ".[api]"
uvicorn viral_pipeline.api:app --reload
```

Then open the automation studio at:

```text
http://127.0.0.1:8000/studio/
```

You can also open [web/index.html](<web/index.html>) directly in a browser. In that mode, the UI keeps a local preview loop until the FastAPI backend is running.

## Configuration

Copy `.env.example` to `.env` and adjust values. The package also reads environment variables directly, so CI and hosted deployments can inject settings without a file.

Important settings:

- `MIN_VIRALITY_SCORE`: Minimum score for candidates to continue.
- `AUTHORIZED_REDDIT_AUTHORS`: Comma-separated source accounts with explicit content rights.
- `YTDLP_BINARY`: `yt-dlp` executable path.
- `OPENMONTAGE_WEBHOOK_URL`: Webhook for original video generation.
- `DIFY_API_URL` and `DIFY_API_KEY`: Dify workflow API settings.
- `N8N_WEBHOOK_URL`: n8n webhook for orchestration/trend requests.
- `POSTIZ_BINARY` and `POSTIZ_INTEGRATION_IDS`: Postiz CLI settings.
- `AUTOMATION_POLL_SECONDS`: How often the FastAPI worker checks due jobs.
- `AUTOMATION_MIN_INTERVAL_MINUTES`: Minimum cadence for continuous jobs.
- `REQUIRE_HUMAN_APPROVAL`: Keeps publishing jobs in review by default.

## Safety Boundaries

This scaffold replaces risky requests with compliant equivalents:

- Watermark removal becomes **reject or review watermarked third-party content**.
- ShadowHash style mutation becomes **dedupe detection and normal format standardization**.
- Stealth browser upload becomes **official API or scheduler queue with rate limits**.
- Scraping without API keys becomes **approved APIs, feeds, and terms-compliant adapters**.

That still leaves plenty of automation: discovery, scoring, downloads for authorized sources, transcoding, captioning, approval queues, and publishing handoff.
