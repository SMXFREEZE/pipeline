# Take-Home Deliverables

This repository now includes two additive take-home deliverables beside the existing Python viral-pipeline project:

1. **agentic.market Agent Brief API** - a Node/TypeScript server that turns messy text into structured JSON briefs for AI agents.
2. **Flooently Remotion video generator** - a vertical 1080x1920 iMessage simulator video system with editable scripts and reusable components.

The existing Python project remains available below under **Legacy Python Viral Video Pipeline**.

## Quick Start for the Take-Homes

```powershell
npm install
npm test
npm run build
npm run dev
```

The server defaults to:

```text
http://localhost:3000
```

Optional env values live in `.env.example`:

```text
PORT=3000
PUBLIC_BASE_URL=http://localhost:3000
```

No secrets are required for the local demo.

## Deliverable 1: agentic.market Agent Brief API

### What It Does

The Agent Brief API turns raw, messy input such as notes, company descriptions, URLs, job posts, or research snippets into a predictable JSON brief:

```json
{
  "summary": "Job post brief: Flooently is hiring a customer success lead in Toronto.",
  "entities": ["Flooently", "Toronto"],
  "opportunities": ["own the first support playbook and improve retention"],
  "risks": ["compensation range and reporting line are unclear"],
  "recommended_next_actions": ["ask the recruiter about team size and success metrics"],
  "confidence": 0.86
}
```

### Why Agents Would Pay

AI agents need clean structured context before taking action. Messy input wastes tokens, increases reasoning errors, and makes downstream workflows brittle. This API gives agents normalized fields such as summaries, entities, risks, opportunities, and next actions. It is useful for recruiting, sales research, due diligence, customer support triage, and task planning.

### Server Commands

```powershell
npm run dev
```

Equivalent:

```powershell
npm run server
npm start
```

### Endpoints

- `GET /health`
- `GET /.well-known/agentic-market.json`
- `GET /openapi.json`
- `GET /x402/status`
- `POST /api/brief`
- `GET /api/videos`
- `GET /api/videos/:id.mp4`
- `POST /api/videos/:id/render`

### Example Calls

Health:

```powershell
curl.exe http://localhost:3000/health
```

Bazaar registration:

```powershell
curl.exe http://localhost:3000/.well-known/agentic-market.json
```

OpenAPI:

```powershell
curl.exe http://localhost:3000/openapi.json
```

x402 readiness:

```powershell
curl.exe http://localhost:3000/x402/status
```

Create a brief:

```powershell
curl.exe -X POST http://localhost:3000/api/brief `
  -H "Content-Type: application/json" `
  -d "{\"text\":\"Flooently is hiring a customer success lead in Toronto. Opportunity: own the first support playbook. Risk: unclear compensation. Next step: ask about success metrics.\",\"mode\":\"job_post\"}"
```

List rendered-video endpoints for the Flooently demo:

```powershell
curl.exe http://localhost:3000/api/videos
```

Download a rendered MP4:

```powershell
curl.exe -L http://localhost:3000/api/videos/french-natural-text.mp4 --output out/demo-french-natural-text.mp4
```

Render or regenerate a video through the server:

```powershell
curl.exe -X POST http://localhost:3000/api/videos/french-natural-text/render
```

Supported `mode` values:

- `company_research`
- `job_post`
- `user_notes`
- `general`

### Bazaar Registration

`GET /.well-known/agentic-market.json` returns a best-likely agentic.market registration object:

```json
{
  "name": "Agent Brief API",
  "description": "Turns messy user, company, job, or research text into structured JSON briefs for AI agents.",
  "base_url": "http://localhost:3000",
  "openapi_url": "http://localhost:3000/openapi.json",
  "health_url": "http://localhost:3000/health",
  "service_url": "http://localhost:3000/api/brief",
  "pricing": {
    "model": "per_request",
    "currency": "USD",
    "price": 0.01
  },
  "auth": {
    "type": "none_for_demo"
  }
}
```

The current agentic.market seller flow is powered by x402. This repo keeps the `.well-known` JSON for reviewer-friendly local inspection, and it can also run the real paid x402 mode for Bazaar discovery.

Local demo mode is free:

```text
auth.type = none_for_demo
x402.enabled = false
```

Enable x402/Bazaar mode before deploying:

```powershell
$env:X402_PAY_TO="0xYourWalletAddress"
$env:PUBLIC_BASE_URL="https://your-deployed-server.example"
npm run dev
```

With `X402_PAY_TO` set, `POST /api/brief` is protected by x402 exact payment, the registration switches to `auth.type = x402`, and the payment route declares Bazaar discovery metadata for the input and output JSON schemas.

Assumption: agentic.market's public homepage points sellers toward x402-powered services, so the production registration path should be a public deployed `POST /api/brief` x402 endpoint. The `.well-known/agentic-market.json` document remains as a helpful compatibility/inspection endpoint for this take-home.

### Deployment

Render or Railway:

```text
Build command: npm install
Start command: npm start
Environment: PUBLIC_BASE_URL=https://your-domain.example
```

For agentic.market/x402 validation, also set:

```text
X402_PAY_TO=0xYourWalletAddress
X402_PRICE=$0.01
X402_NETWORK=eip155:84532
X402_FACILITATOR_URL=https://x402.org/facilitator
X402_SYNC_FACILITATOR_ON_START=true
```

Vercel:

- `api/index.ts` exports the Express app.
- `vercel.json` rewrites all routes to that serverless entry.
- Set `PUBLIC_BASE_URL` to the deployed URL.

Video endpoint deployment:

- `GET /api/videos` is safe on any Node host and returns the available composition IDs plus download/render URLs.
- `GET /api/videos/:id.mp4` serves pre-rendered files from `out/`.
- `POST /api/videos/:id/render` runs Remotion from the server process. Use Render, Railway, a VM, or another long-running Node host for this path; serverless platforms may time out or lack the Chromium/FFmpeg runtime needed for rendering.
- For a phone-recorded demo, the lowest-risk flow is to pre-render the MP4s locally or on the host, serve them from `/api/videos/:id.mp4`, then open the download URL on the phone.

### Known API Limitations

- v1 uses a deterministic local heuristic parser, not an LLM.
- It does not fetch or scrape URLs yet.
- Confidence is a structured heuristic score, not a statistical model.
- Local demo auth is `none_for_demo`; production agentic.market mode needs a real `X402_PAY_TO` wallet and public deployment URL.

## Deliverable 2: Flooently Remotion Video Generator

### What It Does

The Flooently generator creates polished vertical short videos using the current referenced iMessage prototype, `pdugan20/chat-app-prototype`. It includes:

- the full MIT-licensed React Native prototype vendored at `external/chat-app-prototype`
- a Remotion/TypeScript port of the prototype's event model with screenshot-matched dark iMessage chrome
- a local Remotion conversation event timeline and frame-by-frame state machine for deterministic video timing
- message, typing, compose, keypress, receipt, and Flooently result events driven frame by frame
- screenshot-matched black Messages canvas, translucent dark header, system-blue outgoing bubbles, dark-gray incoming bubbles, SVG-style tails, time headers, receipts, compact composer, and Flooently toolbar
- three editable scripts in `src/data/editableScripts.ts`, exposed through `src/data/scripts.ts`
- registered Remotion compositions for MP4 export

The content fits Flooently because each video shows the keyboard helping inside a realistic language-learning texting moment: sounding natural in French, replying in Spanish without switching apps, and understanding casual Spanish group-chat slang.

The current iMessage source reference was pulled from `https://github.com/pdugan20/chat-app-prototype` at commit `db0263a529eb8f81e86129c314e4ed500d91171d`. It is MIT licensed by Patrick Dugan, and its `LICENSE` file is preserved in `external/chat-app-prototype/LICENSE`. The Remotion implementation ports the visual patterns rather than adding Expo/React Native to this take-home.

Third-party license notices are summarized in `THIRD_PARTY_NOTICES.md`.

### Content References

The PDF reference in `C:\Users\sami\Downloads\FlooentlyProjects copy 2.pdf` frames the task as finding viral TikTok formats for Flooently, an iOS AI keyboard that translates and coaches users in their target language inside any app. It asks for 2-3 different format hypotheses, vertical 9:16 MP4s, captions, short hooks, no AI-generated UGC, and no mega brainrot. The YouTube Shorts link is treated only as pacing/vibe inspiration and is not copied.

### Video Rationales

Overall format opinion: I chose these iMessage-style formats because they hit a common language-learning problem: knowing what you want to say, but not knowing how to make it sound natural. The texting UI makes the awkward moment immediately understandable on TikTok and makes Flooently feel like a useful tool inside a real habit instead of a traditional ad. The format can also be repeated across languages, slang, dating, school, travel, and group chats without turning into fake UGC or mega brainrot.

`french-natural-text` / `FlooentlyFrenchNaturalText`: a screen-record utility demo for students who can form a sentence in French but still sound stiff or textbook. The hook opens with the payoff problem immediately, and the format could pop because language learners recognize the gap between "correct" and "natural."

`spanish-reply-panic` / `FlooentlySpanishReplyPanic`: a POV social-texting panic moment where someone understands a Spanish invite but freezes when replying. This is a different hypothesis: emotional relatability first, then a quick product save.

`group-chat-slang` / `FlooentlyGroupChatSlang`: a meme-style language-apps-versus-real-life group-chat format. It keeps the joke useful rather than brainrot by showing Flooently explaining slang and suggesting a natural reply.

Production note: each video is generated from editable data in `src/data/editableScripts.ts`. To ship piece #4 quickly, duplicate one script object, change the `id`, hook, keyboard demo text, and 5-7 message bubbles, then add the composition metadata in `src/data/videoCatalog.ts` if a new endpoint/output filename is needed.

### Preview

```powershell
npm run remotion:preview
```

Equivalent:

```powershell
npx remotion studio src/index.ts
```

### Render MP4s

Student rewrite:

```powershell
npm run render:flooently:french
```

Recruiter follow-up:

```powershell
npm run render:flooently:spanish
```

Workplace clarification:

```powershell
npm run render:flooently:slang
```

Direct Remotion pattern:

```powershell
npx remotion render src/index.ts FlooentlyFrenchNaturalText out/flooently-french-natural-text.mp4
```

All registered videos use:

- width: `1080`
- height: `1920`
- fps: `30`

Submission-ready MP4 copies are also in `videos_takehome/`.

### Hosted Video Endpoints

The same Express server can expose simulated Flooently videos for a demo tool or phone workflow:

- `GET /api/videos` lists the three available videos, their Remotion composition IDs, dimensions, durations, and endpoint URLs.
- `GET /api/videos/french-natural-text.mp4` streams the already-rendered MP4 from `out/flooently-french-natural-text.mp4`.
- `POST /api/videos/french-natural-text/render` renders or regenerates that MP4 with Remotion and returns its download URL.

Available video IDs:

- `french-natural-text`
- `spanish-reply-panic`
- `group-chat-slang`

This means a hosted version can be called by another tool or opened from a phone without manually digging through local files. Rendering on demand is intentionally simple for v1 and is best suited to a persistent Node host.

### Registered Compositions

- `FlooentlyFrenchNaturalText`
- `FlooentlySpanishReplyPanic`
- `FlooentlyGroupChatSlang`

### Editing or Adding Scripts

Editable scripts live in:

```text
src/data/editableScripts.ts
```

To add a new video:

1. Add an editable script object with a unique kebab-case `id`.
2. Keep messages short and readable.
3. Add `timeHeader` and `keyboardDemo` values. `src/data/scripts.ts` converts them into the local Remotion simulator event timeline.
4. Set `showTypingBefore: true` on selected Flooently replies.
5. Add a matching `Composition` ID in `src/Root.tsx`.
6. Add an npm render script if the composition should be exported often.
7. Run `npm test`, `npm run build`, and render a still or MP4.

### Flooently Content Rules

- No mega brainrot.
- No fake AI UGC.
- No fake testimonials.
- No fake influencer dialogue.
- No pretending real users recorded or sent messages.
- No exaggerated or unverifiable claims.
- Keep the tone polished, realistic, useful, and modern.

### Known Video Limitations

- The generator has no audio track yet.
- The React Native prototype itself requires Expo/iOS tooling to run natively; the Remotion MP4 exporter uses a TypeScript/CSS port in `src/data/scripts.ts` and `src/components`.
- The UI is custom CSS and does not use proprietary Apple assets.
- Browser/Chromium setup may be required on a fresh machine with `npx remotion browser ensure`.
- The scripts follow the PDF requirement for different language-learning format hypotheses, while still using the requested iMessage simulator.
- On-demand server rendering uses a child Remotion process and is better for Render/Railway/VM-style hosts than short serverless functions.

## Take-Home Review Checklist

```powershell
npm install
npm test
npm run build
npm run dev
curl.exe http://localhost:3000/health
curl.exe http://localhost:3000/.well-known/agentic-market.json
curl.exe http://localhost:3000/openapi.json
curl.exe http://localhost:3000/x402/status
curl.exe -X POST http://localhost:3000/api/brief -H "Content-Type: application/json" -d "{\"text\":\"Acme AI sells workflow software. Opportunity: faster sourcing. Risk: crowded market. Next action: compare pricing pages.\",\"mode\":\"company_research\"}"
curl.exe http://localhost:3000/api/videos
curl.exe -L http://localhost:3000/api/videos/french-natural-text.mp4 --output out/demo-french-natural-text.mp4
npm run remotion:still:french
```

# Legacy Python Viral Video Pipeline

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
   - Creates publishing jobs for TikTok, Instagram Reels, Shorts, or a scheduler.
   - Postiz CLI adapter can upload media and create drafts/scheduled posts.
   - Production uploaders should use official APIs or approved scheduling tools.
   - Human approval is optional and disabled by default for direct Postiz scheduling.

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
pip install -e ".[api,download]"
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

Create a Postiz post from a generated queue job:

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

That command calls `OPENMONTAGE_WEBHOOK_URL`, treats the returned media as original owned content, skips the virality threshold, generates caption variants, and writes publishing jobs into `publish_queue/`.

If you have not connected a generator yet, create generation request files instead:

```powershell
python -m viral_pipeline.cli generate-startup `
  --startup-name "AcmeAI" `
  --description "AI support assistant for small teams" `
  --plan-only
```

Publish a queued job through Postiz:

```powershell
python -m viral_pipeline.cli publish-postiz publish_queue\JOB_FILE.json
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
- `POSTIZ_BINARY`, `POSTIZ_API_KEY`, and `POSTIZ_INTEGRATION_IDS`: Postiz CLI settings. `POSTIZ_INTEGRATION_IDS` should include the TikTok and Instagram integration IDs from `postiz integrations:list`.
- `AUTOMATION_POLL_SECONDS`: How often the FastAPI worker checks due jobs.
- `AUTOMATION_MIN_INTERVAL_MINUTES`: Minimum cadence for continuous jobs.
- `REQUIRE_HUMAN_APPROVAL`: Set to `true` only when you want Postiz drafts instead of direct scheduling. The default is `false`.

## Safety Boundaries

This scaffold replaces risky requests with compliant equivalents:

- Watermark removal becomes **reject or review watermarked third-party content**.
- ShadowHash style mutation becomes **dedupe detection and normal format standardization**.
- Stealth browser upload becomes **official API or scheduler queue with rate limits**.
- Scraping without API keys becomes **approved APIs, feeds, and terms-compliant adapters**.

That still leaves plenty of automation: discovery, scoring, downloads for authorized sources, transcoding, captioning, approval queues, and publishing handoff.
