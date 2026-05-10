import express, {
  type ErrorRequestHandler,
  type Express,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { spawn } from "node:child_process";
import { constants } from "node:fs";
import { access, mkdir } from "node:fs/promises";
import path from "node:path";
import { BriefValidationError, buildBrief } from "../api/brief";
import {
  SIMULATOR_VIDEOS,
  getSimulatorVideoById,
  toPublicSimulatorVideo,
  type SimulatorVideo,
} from "../data/videoCatalog";
import {
  createX402BazaarConfig,
  createX402PaymentMiddleware,
  createX402Status,
  type X402BazaarConfig,
} from "./x402";

export type CreateAppOptions = {
  baseUrl?: string;
  videoOutDir?: string;
  renderVideo?: RenderVideo;
};

export type RenderVideoArgs = {
  video: SimulatorVideo;
  outputPath: string;
};

export type RenderVideo = (args: RenderVideoArgs) => Promise<void>;

class VideoNotFoundError extends Error {
  constructor(public readonly id: string) {
    super(`Unknown simulator video: ${id}`);
    this.name = "VideoNotFoundError";
  }
}

class VideoNotRenderedError extends Error {
  constructor(
    public readonly video: SimulatorVideo,
    public readonly outputPath: string,
  ) {
    super(`Simulator video has not been rendered: ${video.id}`);
    this.name = "VideoNotRenderedError";
  }
}

class VideoRenderError extends Error {
  constructor(
    public readonly video: SimulatorVideo,
    details: string,
  ) {
    super(`Could not render ${video.id}. ${details}`.trim());
    this.name = "VideoRenderError";
  }
}

export function createApp(options: CreateAppOptions = {}): Express {
  const app = express();
  const startupBaseUrl = resolveStartupBaseUrl(options);
  const startupX402Config = createX402BazaarConfig(startupBaseUrl);
  const x402PaymentMiddleware = createX402PaymentMiddleware(startupX402Config);

  app.disable("x-powered-by");
  app.use(express.json({ limit: "128kb" }));

  if (x402PaymentMiddleware) {
    app.use(x402PaymentMiddleware);
  }

  app.get("/health", (_req: Request, res: Response) => {
    res.json({
      status: "healthy",
      service: "Agent Brief API",
      version: "0.1.0",
    });
  });

  app.get("/.well-known/agentic-market.json", (req: Request, res: Response) => {
    const baseUrl = resolveBaseUrl(req, options);

    res.json(
      createAgenticMarketRegistration(
        baseUrl,
        createX402BazaarConfig(baseUrl),
      ),
    );
  });

  app.get("/openapi.json", (req: Request, res: Response) => {
    const baseUrl = resolveBaseUrl(req, options);

    res.json(createOpenApiSpec(baseUrl, createX402BazaarConfig(baseUrl)));
  });

  app.get("/x402/status", (req: Request, res: Response) => {
    const baseUrl = resolveBaseUrl(req, options);

    res.json(createX402Status(createX402BazaarConfig(baseUrl)));
  });

  app.get("/api/videos", (req: Request, res: Response) => {
    const baseUrl = resolveBaseUrl(req, options);

    res.json({
      videos: SIMULATOR_VIDEOS.map((video) =>
        toPublicSimulatorVideo(video, baseUrl),
      ),
    });
  });

  app.get(
    "/api/videos/:id.mp4",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const video = requireSimulatorVideo(req.params.id);
        const outputPath = resolveVideoOutputPath(video, options);
        await assertReadableFile(outputPath, video);
        res.type("video/mp4").sendFile(outputPath);
      } catch (error) {
        next(error);
      }
    },
  );

  app.post(
    "/api/videos/:id/render",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const video = requireSimulatorVideo(req.params.id);
        const outputPath = resolveVideoOutputPath(video, options);
        await mkdir(path.dirname(outputPath), { recursive: true });
        await (options.renderVideo ?? renderVideoWithRemotion)({
          video,
          outputPath,
        });

        res.json({
          id: video.id,
          status: "rendered",
          output_file_name: video.outputFileName,
          download_url: `${resolveBaseUrl(req, options)}/api/videos/${video.id}.mp4`,
        });
      } catch (error) {
        next(error);
      }
    },
  );

  app.post("/api/brief", (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(buildBrief(req.body));
    } catch (error) {
      next(error);
    }
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

function resolveBaseUrl(req: Request, options: CreateAppOptions): string {
  if (options.baseUrl) {
    return options.baseUrl.replace(/\/+$/g, "");
  }

  const configured = process.env.PUBLIC_BASE_URL || process.env.BASE_URL;

  if (configured) {
    return configured.replace(/\/+$/g, "");
  }

  return `${req.protocol}://${req.get("host") ?? "localhost:3000"}`;
}

function resolveStartupBaseUrl(options: CreateAppOptions): string {
  if (options.baseUrl) {
    return options.baseUrl.replace(/\/+$/g, "");
  }

  const configured = process.env.PUBLIC_BASE_URL || process.env.BASE_URL;

  if (configured) {
    return configured.replace(/\/+$/g, "");
  }

  return `http://localhost:${process.env.PORT ?? 3000}`;
}

function requireSimulatorVideo(id: string): SimulatorVideo {
  const video = getSimulatorVideoById(id);

  if (!video) {
    throw new VideoNotFoundError(id);
  }

  return video;
}

function resolveVideoOutputPath(
  video: SimulatorVideo,
  options: CreateAppOptions,
): string {
  const outDir = path.resolve(options.videoOutDir ?? "out");
  const outputPath = path.resolve(outDir, video.outputFileName);

  if (!outputPath.startsWith(`${outDir}${path.sep}`)) {
    throw new Error("Resolved video output path escaped the output directory.");
  }

  return outputPath;
}

async function assertReadableFile(outputPath: string, video: SimulatorVideo) {
  try {
    await access(outputPath, constants.R_OK);
  } catch {
    throw new VideoNotRenderedError(video, outputPath);
  }
}

async function renderVideoWithRemotion({ video, outputPath }: RenderVideoArgs) {
  await new Promise<void>((resolve, reject) => {
    const remotionCliPath = path.resolve(
      "node_modules",
      "@remotion",
      "cli",
      "remotion-cli.js",
    );
    let stdoutTail = "";
    let stderrTail = "";
    const child = spawn(
      process.execPath,
      [
        remotionCliPath,
        "render",
        "src/index.ts",
        video.compositionId,
        outputPath,
      ],
      {
        cwd: process.cwd(),
        stdio: ["ignore", "pipe", "pipe"],
      },
    );

    child.stdout.on("data", (chunk) => {
      stdoutTail = appendProcessOutput(stdoutTail, chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderrTail = appendProcessOutput(stderrTail, chunk);
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new VideoRenderError(
          video,
          [
            `Remotion render exited with status ${code ?? "null"}.`,
            stderrTail || stdoutTail,
          ]
            .filter(Boolean)
            .join(" "),
        ),
      );
    });
  });
}

function appendProcessOutput(current: string, chunk: Buffer): string {
  return `${current}${chunk.toString("utf8")}`.slice(-4000);
}

function createAgenticMarketRegistration(
  baseUrl: string,
  x402Config: X402BazaarConfig,
) {
  return {
    name: "Agent Brief API",
    description:
      "Turns messy user, company, job, or research text into structured JSON briefs for AI agents.",
    base_url: baseUrl,
    openapi_url: `${baseUrl}/openapi.json`,
    health_url: `${baseUrl}/health`,
    service_url: `${baseUrl}/api/brief`,
    pricing: {
      model: "per_request",
      currency: "USD",
      price: 0.01,
    },
    auth: {
      type: x402Config.enabled ? "x402" : "none_for_demo",
    },
    x402: createX402Status(x402Config),
    use_cases: [
      "agent research preprocessing",
      "sales intelligence",
      "recruiting workflows",
      "job post analysis",
      "customer support triage",
    ],
    contact: {
      name: "Sami El-Figha",
    },
  };
}

function createOpenApiSpec(baseUrl: string, x402Config: X402BazaarConfig) {
  return {
    openapi: "3.0.3",
    info: {
      title: "Agent Brief API",
      version: "0.1.0",
      description:
        "A deterministic v1 API that turns messy text into structured JSON briefs for AI agents.",
    },
    servers: [{ url: baseUrl }],
    paths: {
      "/health": {
        get: {
          summary: "Check service health",
          responses: {
            "200": {
              description: "Service is healthy",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["status", "service", "version"],
                    properties: {
                      status: { type: "string", example: "healthy" },
                      service: { type: "string", example: "Agent Brief API" },
                      version: { type: "string", example: "0.1.0" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/.well-known/agentic-market.json": {
        get: {
          summary: "Get agentic.market bazaar registration metadata",
          responses: {
            "200": {
              description: "Registration metadata",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/AgenticMarketRegistration" },
                },
              },
            },
          },
        },
      },
      "/openapi.json": {
        get: {
          summary: "Get this OpenAPI document",
          responses: {
            "200": {
              description: "OpenAPI 3 document",
              content: {
                "application/json": {
                  schema: { type: "object" },
                },
              },
            },
          },
        },
      },
      "/x402/status": {
        get: {
          summary: "Check x402/Bazaar readiness",
          responses: {
            "200": {
              description: "x402 configuration status for agentic.market validation",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/X402Status" },
                },
              },
            },
          },
        },
      },
      "/api/brief": {
        post: {
          summary: "Create a structured brief from messy text",
          description: x402Config.enabled
            ? "Protected by x402 exact payment and declared for Bazaar discovery."
            : "Free local-demo route. Set X402_PAY_TO to enable x402 payment and Bazaar discovery.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/BriefRequest" },
                examples: {
                  jobPost: {
                    value: {
                      text: "Flooently is hiring a customer success lead. Risk: unclear comp. Next step: ask about success metrics.",
                      mode: "job_post",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Structured brief",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/BriefResponse" },
                },
              },
            },
            "400": {
              description: "Validation error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "402": {
              description:
                "Payment required when X402_PAY_TO is configured for agentic.market x402 mode",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/videos": {
        get: {
          summary: "List available Flooently simulator videos",
          responses: {
            "200": {
              description: "Available simulator videos and endpoint URLs",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["videos"],
                    properties: {
                      videos: {
                        type: "array",
                        items: { $ref: "#/components/schemas/SimulatorVideo" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/videos/{id}.mp4": {
        get: {
          summary: "Download a rendered Flooently simulator MP4",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "Rendered MP4 video",
              content: {
                "video/mp4": {
                  schema: { type: "string", format: "binary" },
                },
              },
            },
            "404": {
              description: "Unknown video or video has not been rendered",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/videos/{id}/render": {
        post: {
          summary: "Render or regenerate a Flooently simulator MP4",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "Render completed",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["id", "status", "download_url"],
                    properties: {
                      id: { type: "string" },
                      status: { type: "string", example: "rendered" },
                      output_file_name: { type: "string" },
                      download_url: { type: "string", format: "uri" },
                    },
                  },
                },
              },
            },
            "404": {
              description: "Unknown video id",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
    },
    components: {
      schemas: {
        BriefRequest: {
          type: "object",
          required: ["text"],
          properties: {
            text: {
              type: "string",
              minLength: 1,
              maxLength: 12000,
              example: "Raw messy text here",
            },
            mode: {
              type: "string",
              enum: ["company_research", "job_post", "user_notes", "general"],
              default: "general",
            },
          },
        },
        BriefResponse: {
          type: "object",
          required: [
            "summary",
            "entities",
            "opportunities",
            "risks",
            "recommended_next_actions",
            "confidence",
          ],
          properties: {
            summary: { type: "string" },
            entities: { type: "array", items: { type: "string" } },
            opportunities: { type: "array", items: { type: "string" } },
            risks: { type: "array", items: { type: "string" } },
            recommended_next_actions: {
              type: "array",
              items: { type: "string" },
            },
            confidence: {
              type: "number",
              minimum: 0,
              maximum: 1,
              example: 0.85,
            },
          },
        },
        AgenticMarketRegistration: {
          type: "object",
          required: [
            "name",
            "description",
            "base_url",
            "openapi_url",
            "health_url",
            "service_url",
            "pricing",
            "auth",
            "use_cases",
            "contact",
          ],
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            base_url: { type: "string", format: "uri" },
            openapi_url: { type: "string", format: "uri" },
            health_url: { type: "string", format: "uri" },
            service_url: { type: "string", format: "uri" },
            pricing: {
              type: "object",
              properties: {
                model: { type: "string" },
                currency: { type: "string" },
                price: { type: "number" },
              },
            },
            auth: {
              type: "object",
              properties: {
                type: { type: "string" },
              },
            },
            use_cases: { type: "array", items: { type: "string" } },
            contact: {
              type: "object",
              properties: {
                name: { type: "string" },
              },
            },
            x402: { $ref: "#/components/schemas/X402Status" },
          },
        },
        X402Status: {
          type: "object",
          required: [
            "enabled",
            "route",
            "service_url",
            "price",
            "network",
            "facilitator_url",
            "pay_to_configured",
            "bazaar_discovery",
          ],
          properties: {
            enabled: { type: "boolean", example: false },
            route: { type: "string", example: "POST /api/brief" },
            service_url: {
              type: "string",
              format: "uri",
              example: "http://localhost:3000/api/brief",
            },
            price: { type: "string", example: "$0.01" },
            network: { type: "string", example: "eip155:84532" },
            facilitator_url: {
              type: "string",
              format: "uri",
              example: "https://x402.org/facilitator",
            },
            pay_to_configured: { type: "boolean", example: false },
            bazaar_discovery: { type: "string" },
          },
        },
        ErrorResponse: {
          type: "object",
          required: ["error", "details"],
          properties: {
            error: { type: "string" },
            details: { type: "array", items: { type: "string" } },
          },
        },
        SimulatorVideo: {
          type: "object",
          required: [
            "id",
            "title",
            "composition_id",
            "output_file_name",
            "width",
            "height",
            "fps",
            "duration_in_frames",
            "duration_seconds",
            "download_url",
            "render_url",
          ],
          properties: {
            id: { type: "string", example: "french-natural-text" },
            title: { type: "string" },
            composition_id: { type: "string" },
            output_file_name: { type: "string" },
            width: { type: "integer", example: 1080 },
            height: { type: "integer", example: 1920 },
            fps: { type: "integer", example: 30 },
            duration_in_frames: { type: "integer" },
            duration_seconds: { type: "number" },
            download_url: { type: "string", format: "uri" },
            render_url: { type: "string", format: "uri" },
          },
        },
      },
    },
  };
}

function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({
    error: "Not found",
    details: ["The requested Agent Brief API endpoint does not exist."],
  });
}

const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof VideoNotFoundError) {
    res.status(404).json({
      error: "Video not found",
      details: [`Unknown Flooently simulator video id: ${error.id}.`],
    });
    return;
  }

  if (error instanceof VideoNotRenderedError) {
    res.status(404).json({
      error: "Video not rendered",
      details: [
        `Run POST /api/videos/${error.video.id}/render or render ${error.video.outputFileName} before downloading it.`,
      ],
    });
    return;
  }

  if (error instanceof VideoRenderError) {
    res.status(500).json({
      error: "Video render failed",
      details: [error.message],
    });
    return;
  }

  if (error instanceof BriefValidationError) {
    res.status(400).json({
      error: "Validation error",
      details: error.details,
    });
    return;
  }

  if (error instanceof SyntaxError && "body" in error) {
    res.status(400).json({
      error: "Validation error",
      details: ["Request body must be valid JSON."],
    });
    return;
  }

  res.status(500).json({
    error: "Internal server error",
    details: ["The Agent Brief API could not process this request."],
  });
};
