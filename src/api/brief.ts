export const BRIEF_MODES = [
  "company_research",
  "job_post",
  "user_notes",
  "general",
] as const;

export type BriefMode = (typeof BRIEF_MODES)[number];

export type BriefInput = {
  text: string;
  mode: BriefMode;
};

export type BriefOutput = {
  summary: string;
  entities: string[];
  opportunities: string[];
  risks: string[];
  recommended_next_actions: string[];
  confidence: number;
};

export class BriefValidationError extends Error {
  public readonly details: string[];

  constructor(details: string[]) {
    super(`Brief validation failed: ${details.join(" ")}`);
    this.name = "BriefValidationError";
    this.details = details;
  }
}

const MODE_DEFAULT_ACTIONS: Record<BriefMode, string[]> = {
  company_research: [
    "Verify the strongest claims against the company's website or trusted sources.",
    "Compare positioning, pricing, and customer segments before taking action.",
  ],
  job_post: [
    "Clarify role scope, compensation range, reporting line, and success metrics.",
    "Extract must-have requirements before drafting outreach or application materials.",
  ],
  user_notes: [
    "Group the notes into decisions, blockers, owners, and immediate next steps.",
    "Confirm any ambiguous asks before executing downstream tasks.",
  ],
  general: [
    "Confirm missing context, then route the brief to the next workflow step.",
    "Use the entities, risks, and opportunities as structured planning inputs.",
  ],
};

const LABEL_PATTERNS = {
  opportunity:
    /(?:^|\b)(?:opportunit(?:y|ies)|upside|potential|benefit|could|can help|improve|faster|own)\s*:?\s*(.+)$/i,
  risk: /(?:^|\b)(?:risk|concern|watch out|blocker|unclear|unknown|issue)\s*:?\s*(.+)$/i,
  action:
    /(?:^|\b)(?:next(?:\s+step|\s+action)?|recommended action|to do|todo|ask|follow up)\s*:?\s*(.+)$/i,
};

const LABELED_SECTION_BOUNDARY =
  /(?<=[.!?])\s+|\n+|;\s*(?=(?:opportunit(?:y|ies)|risk|concern|watch out|blocker|unclear|unknown|issue|next(?:\s+step|\s+action)?|recommended action|to do|todo|ask|follow up)\b)/i;

const STOP_ENTITIES = new Set([
  "A",
  "An",
  "And",
  "As",
  "But",
  "For",
  "If",
  "In",
  "It",
  "Must",
  "Next",
  "Opportunity",
  "Risk",
  "The",
  "This",
  "To",
]);

export function validateBriefInput(raw: unknown): BriefInput {
  const details: string[] = [];

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new BriefValidationError(["Request body must be a JSON object."]);
  }

  const candidate = raw as Record<string, unknown>;
  const text = typeof candidate.text === "string" ? candidate.text.trim() : "";
  const mode =
    typeof candidate.mode === "string" && candidate.mode.trim()
      ? candidate.mode.trim()
      : "general";

  if (!text) {
    details.push("text is required and must be a non-empty string.");
  }

  if (text.length > 12000) {
    details.push("text must be 12,000 characters or fewer for the demo API.");
  }

  if (!BRIEF_MODES.includes(mode as BriefMode)) {
    details.push(
      `mode must be one of: ${BRIEF_MODES.map((value) => `"${value}"`).join(", ")}.`,
    );
  }

  if (details.length > 0) {
    throw new BriefValidationError(details);
  }

  return {
    text,
    mode: mode as BriefMode,
  };
}

export function buildBrief(raw: unknown): BriefOutput {
  const input = validateBriefInput(raw);
  const chunks = splitIntoChunks(input.text);
  const summary = summarize(chunks, input.mode);
  const opportunities = unique([
    ...extractLabeledItems(chunks, "opportunity"),
    ...inferOpportunities(chunks, input.mode),
  ]).slice(0, 5);
  const risks = unique([
    ...extractLabeledItems(chunks, "risk"),
    ...inferRisks(chunks),
  ]).slice(0, 5);
  const recommendedNextActions = unique([
    ...extractLabeledItems(chunks, "action"),
    ...inferActions(chunks),
    ...MODE_DEFAULT_ACTIONS[input.mode],
  ]).slice(0, 5);

  return {
    summary,
    entities: extractEntities(input.text).slice(0, 12),
    opportunities,
    risks,
    recommended_next_actions: recommendedNextActions,
    confidence: calculateConfidence({
      text: input.text,
      opportunities,
      risks,
      recommendedNextActions,
    }),
  };
}

function splitIntoChunks(text: string): string[] {
  return text
    .replace(/\r/g, "\n")
    .split(LABELED_SECTION_BOUNDARY)
    .map((chunk) => chunk.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function summarize(chunks: string[], mode: BriefMode): string {
  const prefixByMode: Record<BriefMode, string> = {
    company_research: "Company research brief:",
    job_post: "Job post brief:",
    user_notes: "User notes brief:",
    general: "General brief:",
  };
  const firstContentChunk =
    chunks.find((chunk) => !/^(opportunit(?:y|ies)|risk|next)/i.test(chunk)) ??
    chunks[0] ??
    "";
  const compact = truncate(firstContentChunk, 260);

  return `${prefixByMode[mode]} ${compact}`;
}

function extractLabeledItems(
  chunks: string[],
  label: keyof typeof LABEL_PATTERNS,
): string[] {
  const pattern = LABEL_PATTERNS[label];

  return chunks
    .map((chunk) => {
      const match = chunk.match(pattern);
      return match?.[1] ? cleanItem(match[1]) : "";
    })
    .filter(Boolean);
}

function inferOpportunities(chunks: string[], mode: BriefMode): string[] {
  const hints = chunks.filter((chunk) =>
    /\b(grow|growth|save|reduce|improve|faster|automate|customer|retention|revenue|demand|hiring|remote|founding|lead)\b/i.test(
      chunk,
    ),
  );

  if (hints.length > 0) {
    return hints.map(cleanItem);
  }

  if (mode === "job_post") {
    return ["Role details can be converted into targeted outreach, screening criteria, or application materials."];
  }

  return ["Messy input can be normalized before downstream agent planning."];
}

function inferRisks(chunks: string[]): string[] {
  const risks = chunks.filter((chunk) =>
    /\b(risk|unclear|unknown|concern|crowded|missing|blocked|delay|expensive|ambiguous|compliance|privacy)\b/i.test(
      chunk,
    ),
  );

  return risks.map(cleanItem);
}

function inferActions(chunks: string[]): string[] {
  return chunks
    .filter((chunk) =>
      /\b(next|ask|clarify|compare|verify|inspect|follow up|schedule|draft|prepare)\b/i.test(
        chunk,
      ),
    )
    .map(cleanItem);
}

function extractEntities(text: string): string[] {
  const entities = new Set<string>();
  const urlMatches = text.match(/https?:\/\/[^\s)]+/gi) ?? [];
  const emailMatches =
    text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? [];
  const capitalizedMatches =
    text.match(
      /\b(?:[A-Z][a-zA-Z0-9&'.-]+|AI|API|SaaS|B2B)(?:[ \t]+(?:[A-Z][a-zA-Z0-9&'.-]+|AI|API|SaaS|B2B)){0,3}\b/g,
    ) ?? [];

  for (const value of [...urlMatches, ...emailMatches, ...capitalizedMatches]) {
    const cleaned = cleanEntity(value);

    if (
      cleaned.length > 1 &&
      !STOP_ENTITIES.has(cleaned) &&
      !/^(Opportunity|Risk|Next action|Next step)$/i.test(cleaned)
    ) {
      entities.add(cleaned);
    }
  }

  return [...entities];
}

function cleanEntity(value: string): string {
  return value
    .replace(
      /\b(?:Opportunity|Opportunities|Risk|Concern|Next action|Next step|Recommended action)\b.*$/i,
      "",
    )
    .trim()
    .replace(/[,:;.]+$/g, "")
    .trim();
}

function calculateConfidence(input: {
  text: string;
  opportunities: string[];
  risks: string[];
  recommendedNextActions: string[];
}): number {
  let score = 0.58;

  if (input.text.length > 160) score += 0.08;
  if (input.text.length > 500) score += 0.05;
  if (input.opportunities.length > 0) score += 0.08;
  if (input.risks.length > 0) score += 0.08;
  if (input.recommendedNextActions.length > 0) score += 0.08;
  if (/(opportunity|risk|next)/i.test(input.text)) score += 0.06;

  return Number(Math.min(0.95, Math.max(0.5, score)).toFixed(2));
}

function cleanItem(value: string): string {
  const withoutLabel = value
    .replace(/^(opportunit(?:y|ies)|risk|next(?:\s+step|\s+action)?|recommended action)\s*:?\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();

  return truncate(withoutLabel.replace(/^[\s:-]+/, ""), 220);
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1).trimEnd()}...`;
}

function unique(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const cleaned = cleanItem(value);
    const key = cleaned.toLocaleLowerCase();

    if (cleaned && !seen.has(key)) {
      seen.add(key);
      result.push(cleaned);
    }
  }

  return result;
}
