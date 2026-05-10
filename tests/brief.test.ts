import { describe, expect, it } from "vitest";
import {
  buildBrief,
  validateBriefInput,
  type BriefMode,
} from "../src/api/brief";

describe("Agent Brief parser", () => {
  it("rejects empty text with a useful validation error", () => {
    expect(() => validateBriefInput({ text: "   ", mode: "general" })).toThrow(
      /text/i,
    );
  });

  it("rejects unsupported modes", () => {
    expect(() =>
      validateBriefInput({ text: "A valid note", mode: "unsupported" }),
    ).toThrow(/mode/i);
  });

  it("rejects non-object payloads and overlong demo inputs", () => {
    expect(() => validateBriefInput(["not", "an", "object"])).toThrow(
      /JSON object/i,
    );
    expect(() =>
      validateBriefInput({ text: "x".repeat(12001), mode: "general" }),
    ).toThrow(/12,000/i);
  });

  it("defaults omitted mode to general and trims text", () => {
    const input = validateBriefInput({
      text: "  Acme has a useful agent workflow note.  ",
    });

    expect(input).toEqual({
      text: "Acme has a useful agent workflow note.",
      mode: "general",
    });
  });

  it("turns messy job-post text into an agent-ready structured brief", () => {
    const brief = buildBrief({
      mode: "job_post",
      text: `
        Flooently is hiring a customer success lead in Toronto.
        Must have SaaS onboarding experience and strong writing skills.
        Opportunity: own the first support playbook and improve retention.
        Risk: compensation range and reporting line are unclear.
        Next step: ask the recruiter about team size and success metrics.
      `,
    });

    expect(brief.summary).toContain("Flooently");
    expect(brief.entities).toEqual(
      expect.arrayContaining(["Flooently", "Toronto"]),
    );
    expect(brief.opportunities.join(" ")).toMatch(/support playbook|retention/i);
    expect(brief.risks.join(" ")).toMatch(/compensation|reporting line/i);
    expect(brief.recommended_next_actions.join(" ")).toMatch(
      /recruiter|team size|success metrics/i,
    );
    expect(brief.confidence).toBeGreaterThanOrEqual(0.5);
    expect(brief.confidence).toBeLessThanOrEqual(0.95);
  });

  it("separates semicolon-delimited opportunity, risk, and next-action labels", () => {
    const brief = buildBrief({
      mode: "company_research",
      text: "Acme AI sells recruiting workflow software. Opportunity: faster sourcing; Risk: crowded market; Next step: compare pricing pages.",
    });

    expect(brief.opportunities).toContain("faster sourcing");
    expect(brief.opportunities.join(" ")).not.toMatch(/Risk|Next step/i);
    expect(brief.risks).toContain("crowded market");
    expect(brief.recommended_next_actions).toContain("compare pricing pages.");
  });

  it("does not include brief labels in adjacent entity names", () => {
    const brief = buildBrief({
      mode: "job_post",
      text: "Flooently is hiring a customer success lead in Toronto. Opportunity: own the first support playbook. Risk: unclear compensation.",
    });

    expect(brief.entities).toContain("Toronto");
    expect(brief.entities).not.toContain("Toronto. Opportunity");
  });

  it("deduplicates repeated labels and extracts URLs and emails as entities", () => {
    const brief = buildBrief({
      mode: "user_notes",
      text: `
        Contact Jordan at jordan@example.com about https://example.com/demo.
        Opportunity: reduce manual triage.
        Opportunity: reduce manual triage.
        Risk: missing compliance review.
        Next action: schedule security review.
      `,
    });

    expect(brief.entities).toEqual(
      expect.arrayContaining(["jordan@example.com", "https://example.com/demo"]),
    );
    expect(
      brief.opportunities.filter((item) => item === "reduce manual triage."),
    ).toHaveLength(1);
  });

  it("normalizes each supported mode", () => {
    const modes: BriefMode[] = [
      "company_research",
      "job_post",
      "user_notes",
      "general",
    ];

    for (const mode of modes) {
      const input = validateBriefInput({
        mode,
        text: "Acme builds tools for AI agents. Risk: unknown pricing. Next step: inspect docs.",
      });

      expect(input.mode).toBe(mode);
    }
  });
});
