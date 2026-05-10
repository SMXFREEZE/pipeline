import { HTTPFacilitatorClient, x402ResourceServer } from "@x402/core/server";
import type { RoutesConfig } from "@x402/core/server";
import type { Network } from "@x402/core/types";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { paymentMiddleware } from "@x402/express";
import { bazaarResourceServerExtension, declareDiscoveryExtension } from "@x402/extensions/bazaar";
import type { RequestHandler } from "express";

const DEFAULT_FACILITATOR_URL = "https://x402.org/facilitator";
const DEFAULT_NETWORK = "eip155:84532";
const DEFAULT_PRICE = "$0.01";
const BRIEF_ROUTE = "POST /api/brief";

const BRIEF_REQUEST_SCHEMA = {
  type: "object",
  required: ["text"],
  additionalProperties: false,
  properties: {
    text: {
      type: "string",
      minLength: 1,
      maxLength: 12000,
      description: "Messy notes, job posts, company descriptions, URLs, or research text.",
    },
    mode: {
      type: "string",
      enum: ["company_research", "job_post", "user_notes", "general"],
      default: "general",
    },
  },
};

const BRIEF_RESPONSE_SCHEMA = {
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
    recommended_next_actions: { type: "array", items: { type: "string" } },
    confidence: { type: "number", minimum: 0, maximum: 1 },
  },
};

const BRIEF_RESPONSE_EXAMPLE = {
  summary:
    "Job post brief: Flooently is hiring for a customer success role and the next question is about success metrics.",
  entities: ["Flooently"],
  opportunities: ["clarify the role's impact and success criteria before interviewing"],
  risks: ["compensation and reporting line are unclear"],
  recommended_next_actions: ["ask the recruiter for team size and success metrics"],
  confidence: 0.86,
};

export type X402BazaarConfig = {
  enabled: boolean;
  route: typeof BRIEF_ROUTE;
  serviceUrl: string;
  price: string;
  network: string;
  facilitatorUrl: string;
  payTo?: string;
  syncFacilitatorOnStart: boolean;
};

export function createX402BazaarConfig(
  baseUrl: string,
  env: NodeJS.ProcessEnv = process.env,
): X402BazaarConfig {
  const payTo = readOptionalEnv(env.X402_PAY_TO);

  return {
    enabled: Boolean(payTo),
    route: BRIEF_ROUTE,
    serviceUrl: `${baseUrl.replace(/\/+$/g, "")}/api/brief`,
    price: readOptionalEnv(env.X402_PRICE) ?? DEFAULT_PRICE,
    network: readOptionalEnv(env.X402_NETWORK) ?? DEFAULT_NETWORK,
    facilitatorUrl: readOptionalEnv(env.X402_FACILITATOR_URL) ?? DEFAULT_FACILITATOR_URL,
    payTo,
    syncFacilitatorOnStart: env.X402_SYNC_FACILITATOR_ON_START !== "false",
  };
}

export function createX402PaymentMiddleware(
  config: X402BazaarConfig,
): RequestHandler | undefined {
  if (!config.enabled || !config.payTo) {
    return undefined;
  }

  const facilitatorClient = new HTTPFacilitatorClient({
    url: config.facilitatorUrl,
  });
  const resourceServer = new x402ResourceServer(facilitatorClient)
    .register(config.network as Network, new ExactEvmScheme())
    .registerExtension(bazaarResourceServerExtension);

  const routes: RoutesConfig = {
    [config.route]: {
      accepts: {
        scheme: "exact",
        price: config.price,
        network: config.network as Network,
        payTo: config.payTo,
        maxTimeoutSeconds: 120,
      },
      resource: config.serviceUrl,
      description:
        "Turn messy notes, URLs, company descriptions, or job posts into structured JSON briefs for AI agents.",
      mimeType: "application/json",
      unpaidResponseBody: () => ({
        contentType: "application/json",
        body: {
          error: "Payment required",
          details: [
            "This Agent Brief API route is protected by x402 when X402_PAY_TO is configured.",
          ],
        },
      }),
      extensions: {
        ...declareDiscoveryExtension({
          input: {
            text: "Flooently is hiring a customer success lead. Opportunity: own onboarding. Risk: unclear compensation.",
            mode: "job_post",
          },
          inputSchema: BRIEF_REQUEST_SCHEMA,
          bodyType: "json",
          output: {
            schema: BRIEF_RESPONSE_SCHEMA,
            example: BRIEF_RESPONSE_EXAMPLE,
          },
        }),
      },
    },
  };

  return paymentMiddleware(
    routes,
    resourceServer,
    {
      appName: "Agent Brief API",
      testnet: config.network === DEFAULT_NETWORK,
    },
    undefined,
    config.syncFacilitatorOnStart,
  );
}

export function createX402Status(config: X402BazaarConfig) {
  return {
    enabled: config.enabled,
    route: config.route,
    service_url: config.serviceUrl,
    price: config.price,
    network: config.network,
    facilitator_url: config.facilitatorUrl,
    pay_to_configured: Boolean(config.payTo),
    bazaar_discovery: config.enabled
      ? "declared_on_x402_payment_route"
      : "set_X402_PAY_TO_to_enable_x402_bazaar_discovery",
  };
}

function readOptionalEnv(value: string | undefined): string | undefined {
  const normalized = value?.trim();

  return normalized ? normalized : undefined;
}
