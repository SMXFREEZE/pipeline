---
name: local-take-home-deliverables
description: How to build, run, test, render, and review the agentic.market Agent Brief API and Flooently Remotion video generator in this repository.
---

# Project Goals

This repository now contains two reviewer-facing take-home deliverables:

1. **agentic.market take-home**: a Node/TypeScript Agent Brief API that turns messy input into predictable JSON briefs for AI agents.
2. **Flooently AI-generated content project**: a Remotion-based vertical video generator that mirrors the referenced Flooently iMessage simulator with editable scripts for polished short-form content.

The existing Python viral-pipeline code remains in place. The Node/TypeScript deliverables are additive and should not break the Python package or tests.

# File Structure

Expected main files:

- `package.json`: Node scripts and dependencies.
- `tsconfig.json`: TypeScript settings.
- `src/server/index.ts`: local Express server entrypoint.
- `src/server/app.ts`: Express app factory.
- `src/server/x402.ts`: optional x402 exact-payment and Bazaar discovery wiring for agentic.market.
- `src/api/brief.ts`: deterministic Agent Brief parser, validation, and response helpers.
- `src/index.ts`: Remotion entrypoint.
- `src/Root.tsx`: Remotion composition registry.
- `src/compositions/FlooentlyMessageVideo.tsx`: reusable vertical video composition.
- `src/components/PhoneFrame.tsx`: full-screen simulator shell matching the source renderer layout.
- `src/components/MessageBubble.tsx`: iMessage-style bubble component.
- `src/components/TypingBubble.tsx`: typing indicator animation.
- `src/components/StatusBar.tsx`: plausible phone status bar.
- `src/data/scripts.ts`: public data API for scripts, durations, and compatibility exports.
- `src/data/editableScripts.ts`: editable Flooently script fixtures.
- `src/data/conversation.ts`: conversion from editable scripts into source-style simulator events.
- `src/data/simulator.ts`: frame-by-frame simulator state machine.
- `src/data/autocomplete.ts`: deterministic compose/autocomplete data for simulator events.
- `src/data/videoCatalog.ts`: shared catalog for composition IDs, MP4 filenames, and hosted video endpoint metadata.
- `src/data/types.ts`: shared simulator and script types.
- `src/styles/global.css`: Remotion video styling.
- `external/chat-app-prototype`: full MIT-licensed React Native iMessage prototype used as the current visual source of truth.
- `tests/*.test.ts`: TypeScript tests for API behavior, server routes, and script data.
- `README.md`: reviewer-facing instructions for both deliverables.
- `.env.example`: optional configuration without secrets.

# Install Commands

Use Node 18 or newer.

```powershell
npm install
```

The existing Python project can still be installed separately:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e ".[api,dev]"
```

# Local Dev Commands

Run the Agent Brief API server:

```powershell
npm run dev
```

Run TypeScript checks:

```powershell
npm run build
```

Run tests:

```powershell
npm test
```

# Server Commands

Default local server:

```powershell
npm run server
```

Useful endpoint checks:

```powershell
curl http://localhost:3000/health
curl http://localhost:3000/.well-known/agentic-market.json
curl http://localhost:3000/openapi.json
curl http://localhost:3000/x402/status
curl -X POST http://localhost:3000/api/brief -H "Content-Type: application/json" -d "{\"text\":\"Acme is hiring a founding AE. Must know B2B SaaS. Risk: unclear comp.\",\"mode\":\"job_post\"}"
curl http://localhost:3000/api/videos
curl -L http://localhost:3000/api/videos/french-natural-text.mp4 --output out/demo-french-natural-text.mp4
curl -X POST http://localhost:3000/api/videos/french-natural-text/render
```

# Video Preview Commands

Open Remotion Studio:

```powershell
npm run remotion:preview
```

Equivalent direct command:

```powershell
npx remotion studio src/index.ts
```

# Video Render and Export Commands

Render individual 1080x1920 MP4s:

```powershell
npm run render:flooently:french
npm run render:flooently:spanish
npm run render:flooently:slang
```

Direct Remotion pattern:

```powershell
npx remotion render src/index.ts FlooentlyFrenchNaturalText out/flooently-french-natural-text.mp4
```

# Coding Conventions

- Keep the Node/TypeScript deliverables small, readable, and deterministic.
- Prefer pure helpers for parsing, validation, timing, and script lookup so they are easy to test.
- Do not hardcode secrets. Use environment variables only for optional config.
- Keep server logic in `src/server` and reusable brief logic in `src/api`.
- Keep editable video data in `src/data/editableScripts.ts`, not embedded inside components.
- Keep composition IDs and server-facing MP4 metadata in `src/data/videoCatalog.ts`.
- Avoid adding heavy dependencies unless they remove real complexity.
- Preserve existing Python code and unrelated local changes.

# Remotion and Video-Generation Rules

- Use Remotion primitives such as `Composition`, `AbsoluteFill`, `useCurrentFrame`, `interpolate`, and `spring`.
- Vertical videos must be 1080x1920, 30 FPS.
- Keep text large and readable on mobile screens.
- Message timing should feel natural, with enough frames for reading.
- Avoid flashing effects, aggressive shaking, and excessive transitions.
- Use deterministic animation and script data so renders are repeatable.
- Register one composition per content piece.
- Export MP4s into `out/`.
- The server may expose rendered MP4s through `/api/videos/:id.mp4`; those files should map to the same `out/` filenames used by the render scripts.

# iMessage Simulator Design Rules

- The current visual source of truth is `external/chat-app-prototype`, copied from `pdugan20/chat-app-prototype` commit `db0263a529eb8f81e86129c314e4ed500d91171d`.
- Preserve the upstream MIT license notice in `external/chat-app-prototype/LICENSE` when copying or redistributing substantial parts of the prototype.
- The Remotion implementation should port the prototype's event model and match the latest real iMessage screenshot direction: black Messages canvas, translucent dark navigation/input chrome, system-blue outgoing bubbles, dark-gray incoming bubbles, SVG-style tails, native-style typing indicator, 75% max bubble width, and subtle timestamp grouping.
- The Remotion implementation uses a local `ConversationScript` event timeline and snapshot state machine for deterministic timing: `message`, `typingStart`, `typingStop`, `read`, `delivered`, `timeHeader`, `composeStart`, `keyPress`, `autocomplete`, `flooentlyActivate`, `flooentlyLoading`, `flooentlyResult`, `flooentlyDismiss`, and `pause`.
- Build the full-screen iMessage simulator layout without proprietary Apple assets.
- Use dark iMessage-style status/nav chrome, contact header, message list, compact composer area, and Flooently toolbar. Avoid showing a large keyboard panel in final rendered shorts unless the script specifically needs it.
- User/self messages appear on the right.
- Flooently/assistant messages appear on the left.
- Bubble max width should stay around 70-78%.
- Group consecutive bubbles by sender; only the last bubble in a run gets the iMessage-style tail.
- Add time headers and delivered/read receipts where useful.
- Use realistic spacing, readable font sizes, and safe margins for Shorts/Reels/TikTok overlays.
- Break long ideas into multiple message bubbles instead of walls of text.
- Show typing bubbles before selected Flooently replies.

# Flooently Content Rules

- Content should be polished, realistic, useful, and modern.
- Short-form pacing is allowed, but avoid spammy or cringe tropes.
- Do not use mega brainrot.
- Do not create AI UGC.
- Do not invent fake testimonials or fake influencer dialogue.
- Do not pretend real users recorded or sent the messages.
- Do not make exaggerated or unverifiable claims.
- Use the Flooently PDF brief when available: Flooently is an iOS AI keyboard for translating and coaching users in their target language inside any app.
- Each Flooently piece should be a different TikTok format hypothesis, not three versions of the same idea.
- Include a short rationale and production note in the README so the next person can make piece #4 quickly.

# agentic.market Server Rules

- The Agent Brief API must expose:
  - `GET /health`
  - `GET /.well-known/agentic-market.json`
  - `GET /openapi.json`
  - `GET /x402/status`
  - `POST /api/brief`
  - `GET /api/videos`
  - `GET /api/videos/:id.mp4`
  - `POST /api/videos/:id/render`
- `POST /api/brief` accepts JSON with `text` and optional `mode`.
- Supported modes are `company_research`, `job_post`, `user_notes`, and `general`.
- Validate input and return useful 400 errors for malformed requests.
- Keep v1 deterministic and local. Optional LLM support may be added only when secrets are externalized.
- The server must be easy to run locally and deploy to Vercel, Render, Railway, or another Node host.
- For real agentic.market validation, configure `X402_PAY_TO` so `POST /api/brief` becomes an x402 exact-payment route with Bazaar discovery metadata.
- Server-side video rendering spawns Remotion and is best suited to Render, Railway, a VM, or another persistent Node host. Serverless deploys may list videos and serve bundled/pre-rendered MP4s, but on-demand rendering can hit timeout or Chromium runtime limits.

# agentic.market Registration Assumptions

agentic.market currently points sellers toward x402-powered services. Keep the take-home-friendly registration document at:

```text
/.well-known/agentic-market.json
```

The registration should include service name, description, base URL, OpenAPI URL, health URL, service URL, pricing, auth model, x402 status, use cases, and contact. Document this assumption in `README.md`.

For local review, `X402_PAY_TO` can be empty and `auth.type` will be `none_for_demo`. For Bazaar validation, set:

```powershell
$env:X402_PAY_TO="0xYourWalletAddress"
$env:PUBLIC_BASE_URL="https://your-deployed-server.example"
npm run dev
```

Then submit the public `POST /api/brief` endpoint as the x402 paid resource.

# How to Add New Video Scripts

1. Open `src/data/editableScripts.ts`.
2. Add a new editable script object with a unique `id`.
3. Keep messages short and split long rewrites into multiple bubbles.
4. Add `timeHeader` and `keyboardDemo`; the helper converts editable messages into local simulator events.
5. Set `showTypingBefore: true` on selected Flooently replies.
6. Add a matching `Composition` in `src/Root.tsx`.
7. Add a composition ID and output filename mapping in `src/data/videoCatalog.ts`.
8. Add a render script to `package.json` if the composition should be exported often.
9. Run `npm run build` and render a still or MP4 to verify readability.

# How to Render 1080x1920 Vertical MP4s

Each Remotion composition must use:

```ts
width={1080}
height={1920}
fps={30}
```

Render with:

```powershell
npx remotion render src/index.ts CompositionId out/file-name.mp4
```

Expose a rendered MP4 over the local server:

```powershell
npm run server
curl http://localhost:3000/api/videos
curl -L http://localhost:3000/api/videos/french-natural-text.mp4 --output out/demo-french-natural-text.mp4
```

Let a hosted tool regenerate a video through an endpoint:

```powershell
curl -X POST http://localhost:3000/api/videos/french-natural-text/render
```

# Common Remotion and Server Debugging

- If Remotion cannot find a composition, confirm `src/index.ts` calls `registerRoot(RemotionRoot)` and `src/Root.tsx` registers the ID.
- If video text is too small, increase component font sizes in `src/styles/global.css` and re-render a still.
- If message timing feels rushed, increase `delayAfter` or duration helpers in `src/data/scripts.ts`.
- If the server port is busy, set `PORT=3001` before running `npm run dev`.
- If `/api/videos/:id.mp4` returns `Video not rendered`, either render locally into `out/` or call `POST /api/videos/:id/render`.
- If `/api/videos/:id/render` fails on a hosted server, confirm Node can run Chromium and FFmpeg and that the host timeout is long enough for Remotion rendering.
- If `/api/brief` returns 402, x402 mode is enabled; either provide a valid x402 payment header or clear `X402_PAY_TO` for local free testing.
- If x402 mode returns a facilitator/network error, check `X402_NETWORK=eip155:84532`, `X402_FACILITATOR_URL=https://x402.org/facilitator`, and that `X402_PAY_TO` is a real wallet address.
- If JSON body parsing fails, confirm requests include `Content-Type: application/json`.
- If TypeScript cannot resolve React or Remotion types, run `npm install`.
- If Chromium/Remotion rendering fails on a fresh machine, run `npx remotion browser ensure`.

# Final Reviewer Checklist

- `npm install` completes.
- `npm test` passes.
- `npm run build` passes.
- Server starts with `npm run dev` or `npm run server`.
- `GET /health` returns healthy JSON.
- `GET /.well-known/agentic-market.json` returns bazaar registration JSON.
- `GET /openapi.json` returns an OpenAPI 3.0 document matching the implemented endpoints.
- `GET /x402/status` shows whether x402/Bazaar mode is enabled and what endpoint will be submitted.
- `POST /api/brief` works with example input and useful validation errors.
- `GET /api/videos` lists every Flooently script with composition IDs, dimensions, durations, and download/render URLs.
- `GET /api/videos/:id.mp4` serves a rendered MP4 or returns a useful `Video not rendered` error.
- `POST /api/videos/:id/render` can regenerate a video on hosts that support Remotion rendering.
- README explains why agents would pay for the Agent Brief API.
- README documents bazaar registration assumptions.
- Flooently has at least 2-3 scripts in `src/data/scripts.ts`.
- Remotion compositions are registered for all scripts.
- Videos are 1080x1920 at 30 FPS.
- Messages animate one by one.
- Typing bubbles appear before selected Flooently replies.
- Text is readable and not blocked by likely Shorts/Reels UI overlays.
- Content avoids fake testimonials, fake UGC, and exaggerated claims.
- No secrets are hardcoded.
- The project remains simple, working, demoable, and easy to extend.
