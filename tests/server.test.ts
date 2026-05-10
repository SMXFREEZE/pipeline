import request from "supertest";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createApp } from "../src/server/app";

describe("Agent Brief API server", () => {
  const app = createApp({
    baseUrl: "http://localhost:3000",
  });
  const tempDirs: string[] = [];

  afterEach(async () => {
    await Promise.all(
      tempDirs.splice(0).map((dir) =>
        rm(dir, {
          recursive: true,
          force: true,
        }),
      ),
    );
  });

  it("serves a health endpoint", async () => {
    const response = await request(app).get("/health").expect(200);

    expect(response.body).toMatchObject({
      status: "healthy",
      service: "Agent Brief API",
    });
  });

  it("serves an agentic.market registration document", async () => {
    const response = await request(app)
      .get("/.well-known/agentic-market.json")
      .expect(200);

    expect(response.body).toMatchObject({
      name: "Agent Brief API",
      base_url: "http://localhost:3000",
      service_url: "http://localhost:3000/api/brief",
      pricing: {
        model: "per_request",
        currency: "USD",
        price: 0.01,
      },
      auth: {
        type: "none_for_demo",
      },
      x402: {
        enabled: false,
        route: "POST /api/brief",
        service_url: "http://localhost:3000/api/brief",
        price: "$0.01",
        network: "eip155:84532",
        pay_to_configured: false,
      },
    });
    expect(response.body.use_cases).toContain("job post analysis");
  });

  it("normalizes configured base URLs without trailing slashes", async () => {
    const appWithTrailingSlash = createApp({
      baseUrl: "https://briefs.example.com///",
    });

    const response = await request(appWithTrailingSlash)
      .get("/.well-known/agentic-market.json")
      .expect(200);

    expect(response.body.base_url).toBe("https://briefs.example.com");
    expect(response.body.openapi_url).toBe(
      "https://briefs.example.com/openapi.json",
    );
  });

  it("serves OpenAPI documentation for the implemented endpoints", async () => {
    const response = await request(app).get("/openapi.json").expect(200);

    expect(response.body.openapi).toMatch(/^3\./);
    expect(Object.keys(response.body.paths)).toEqual(
      expect.arrayContaining([
        "/health",
        "/.well-known/agentic-market.json",
        "/openapi.json",
        "/x402/status",
        "/api/brief",
        "/api/videos",
        "/api/videos/{id}.mp4",
        "/api/videos/{id}/render",
      ]),
    );
  });

  it("exposes x402 Bazaar readiness status for agentic.market validation", async () => {
    const response = await request(app).get("/x402/status").expect(200);

    expect(response.body).toMatchObject({
      enabled: false,
      route: "POST /api/brief",
      service_url: "http://localhost:3000/api/brief",
      price: "$0.01",
      network: "eip155:84532",
      facilitator_url: "https://x402.org/facilitator",
      pay_to_configured: false,
      bazaar_discovery: "set_X402_PAY_TO_to_enable_x402_bazaar_discovery",
    });
  });

  it("switches registration metadata to x402 mode when a pay-to wallet is configured", async () => {
    const previousPayTo = process.env.X402_PAY_TO;
    const previousSync = process.env.X402_SYNC_FACILITATOR_ON_START;

    process.env.X402_PAY_TO = "0x0000000000000000000000000000000000000001";
    process.env.X402_SYNC_FACILITATOR_ON_START = "false";

    try {
      const x402App = createApp({
        baseUrl: "https://briefs.example.com",
      });
      const response = await request(x402App)
        .get("/.well-known/agentic-market.json")
        .expect(200);

      expect(response.body.auth.type).toBe("x402");
      expect(response.body.x402).toMatchObject({
        enabled: true,
        route: "POST /api/brief",
        service_url: "https://briefs.example.com/api/brief",
        price: "$0.01",
        network: "eip155:84532",
        pay_to_configured: true,
        bazaar_discovery: "declared_on_x402_payment_route",
      });
    } finally {
      restoreOptionalEnv("X402_PAY_TO", previousPayTo);
      restoreOptionalEnv(
        "X402_SYNC_FACILITATOR_ON_START",
        previousSync,
      );
    }
  });

  it("lists available Flooently simulator videos with download and render URLs", async () => {
    const response = await request(app).get("/api/videos").expect(200);

    expect(response.body.videos).toHaveLength(3);
    expect(response.body.videos[0]).toEqual(
      expect.objectContaining({
        id: "french-natural-text",
        composition_id: "FlooentlyFrenchNaturalText",
        width: 1080,
        height: 1920,
        fps: 30,
        download_url: "http://localhost:3000/api/videos/french-natural-text.mp4",
        render_url: "http://localhost:3000/api/videos/french-natural-text/render",
      }),
    );
  });

  it("streams an existing simulator MP4 by script id", async () => {
    const videoOutDir = await mkdtemp(path.join(tmpdir(), "flooently-videos-"));
    tempDirs.push(videoOutDir);
    await writeFile(
      path.join(videoOutDir, "flooently-french-natural-text.mp4"),
      "fake mp4 bytes",
    );
    const videoApp = createApp({
      baseUrl: "http://localhost:3000",
      videoOutDir,
    });

    const response = await request(videoApp)
      .get("/api/videos/french-natural-text.mp4")
      .expect(200);

    expect(response.headers["content-type"]).toMatch(/video\/mp4/);
    expect(Buffer.from(response.body).toString("utf8")).toBe("fake mp4 bytes");
  });

  it("returns a useful 404 when a simulator MP4 has not been rendered yet", async () => {
    const videoOutDir = await mkdtemp(path.join(tmpdir(), "flooently-videos-"));
    tempDirs.push(videoOutDir);
    const videoApp = createApp({
      baseUrl: "http://localhost:3000",
      videoOutDir,
    });

    const response = await request(videoApp)
      .get("/api/videos/french-natural-text.mp4")
      .expect(404);

    expect(response.body.error).toBe("Video not rendered");
    expect(response.body.details[0]).toMatch(/render/i);
  });

  it("returns a useful 404 for unknown simulator video ids", async () => {
    const response = await request(app)
      .get("/api/videos/unknown-video.mp4")
      .expect(404);

    expect(response.body.error).toBe("Video not found");
    expect(response.body.details[0]).toMatch(/unknown-video/i);
  });

  it("can regenerate a simulator video through an injectable render hook", async () => {
    const videoOutDir = await mkdtemp(path.join(tmpdir(), "flooently-videos-"));
    tempDirs.push(videoOutDir);
    const videoApp = createApp({
      baseUrl: "http://localhost:3000",
      videoOutDir,
      renderVideo: async ({ outputPath }) => {
        await writeFile(outputPath, "rendered mp4");
      },
    });

    const response = await request(videoApp)
      .post("/api/videos/french-natural-text/render")
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        id: "french-natural-text",
        status: "rendered",
        download_url: "http://localhost:3000/api/videos/french-natural-text.mp4",
      }),
    );
  });

  it("returns a structured brief for valid POST input", async () => {
    const response = await request(app)
      .post("/api/brief")
      .send({
        mode: "company_research",
        text: "Acme AI sells workflow software to recruiters. Opportunity: faster sourcing. Risk: crowded market. Next action: compare pricing pages.",
      })
      .expect(200);

    expect(response.body).toEqual({
      summary: expect.any(String),
      entities: expect.any(Array),
      opportunities: expect.any(Array),
      risks: expect.any(Array),
      recommended_next_actions: expect.any(Array),
      confidence: expect.any(Number),
    });
    expect(response.body.entities).toContain("Acme AI");
  });

  it("defaults POST mode to general when omitted", async () => {
    const response = await request(app)
      .post("/api/brief")
      .send({
        text: "A messy note about Acme AI. Risk: unclear owner. Next step: confirm owner.",
      })
      .expect(200);

    expect(response.body.summary).toMatch(/^General brief:/);
  });

  it("returns 400 for invalid brief input", async () => {
    const response = await request(app)
      .post("/api/brief")
      .send({ text: "", mode: "general" })
      .expect(400);

    expect(response.body.error).toMatch(/validation/i);
    expect(response.body.details[0]).toMatch(/text/i);
  });

  it("returns 400 for malformed JSON bodies", async () => {
    const response = await request(app)
      .post("/api/brief")
      .set("Content-Type", "application/json")
      .send('{"text":')
      .expect(400);

    expect(response.body).toEqual({
      error: "Validation error",
      details: ["Request body must be valid JSON."],
    });
  });

  it("returns 404 JSON for unknown routes", async () => {
    const response = await request(app).get("/missing").expect(404);

    expect(response.body.error).toBe("Not found");
    expect(response.body.details[0]).toMatch(/does not exist/i);
  });
});

function restoreOptionalEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}
