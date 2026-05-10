import { describe, expect, it } from "vitest";
import {
  FLOOENTLY_SCRIPTS,
  IMESSAGE_SIMULATOR_REFERENCE,
  getSimulatorSnapshot,
  getScriptById,
  getScriptDurationInFrames,
  isLastInSenderRun,
  type ThreadBubble,
} from "../src/data/scripts";

describe("Flooently script data", () => {
  it("contains three polished editable content scripts", () => {
    expect(FLOOENTLY_SCRIPTS).toHaveLength(3);

    for (const script of FLOOENTLY_SCRIPTS) {
      expect(script.id).toMatch(/^[a-z0-9-]+$/);
      expect(script.title.length).toBeGreaterThan(5);
      expect(script.contactName).toContain("Flooently");
      expect(script.hook.length).toBeGreaterThan(10);
      expect(script.messages.length).toBeGreaterThanOrEqual(5);
      expect(script.messages.some((message) => message.showTypingBefore)).toBe(
        true,
      );
    }
  });

  it("keeps scripts within the stated content boundaries", () => {
    const forbidden = [
      /testimonial/i,
      /influencer/i,
      /sent me this/i,
      /real user/i,
      /guaranteed/i,
    ];

    for (const script of FLOOENTLY_SCRIPTS) {
      const fullText = [
        script.title,
        script.hook,
        script.caption ?? "",
        ...script.messages.map((message) => message.text),
      ].join(" ");

      for (const pattern of forbidden) {
        expect(fullText).not.toMatch(pattern);
      }
    }
  });

  it("can look up scripts and calculate readable Remotion durations", () => {
    const script = getScriptById("french-natural-text");

    expect(script.title).toMatch(/French/i);
    expect(getScriptDurationInFrames(script)).toBeGreaterThanOrEqual(480);
  });

  it("tracks the source simulator branch and source-inspired chrome metadata", () => {
    expect(IMESSAGE_SIMULATOR_REFERENCE.branch).toBe("main");
    expect(IMESSAGE_SIMULATOR_REFERENCE.requestedUrl).toContain(
      "pdugan20/chat-app-prototype",
    );
    expect(IMESSAGE_SIMULATOR_REFERENCE.importedConcepts).toEqual(
      expect.arrayContaining([
        "MIT-licensed React Native iMessage clone",
        "dark Messages-style navigation and input bars",
        "SVG-style bubble tails",
        "compact iMessage composer",
        "Flooently toolbar",
      ]),
    );

    for (const script of FLOOENTLY_SCRIPTS) {
      expect(script.timeHeader).toMatch(/Today/);
      expect(script.keyboardDemo.composeText.length).toBeGreaterThan(10);
      expect(script.keyboardDemo.suggestions).toHaveLength(3);
      expect(["improve", "translate"]).toContain(script.keyboardDemo.mode);
      expect(["FR", "ES"]).toContain(script.keyboardDemo.language);
    }
  });

  it("marks only the last bubble in a sender run for the iMessage tail", () => {
    const script = getScriptById("french-natural-text");

    expect(isLastInSenderRun(script.messages, 0)).toBe(false);
    expect(isLastInSenderRun(script.messages, 1)).toBe(true);
    expect(isLastInSenderRun(script.messages, 2)).toBe(false);
    expect(isLastInSenderRun(script.messages, 4)).toBe(true);
  });

  it("uses a simulator event model instead of a static chat timeline", () => {
    const script = getScriptById("french-natural-text");
    const eventTypes = script.conversation.events.map(({ event }) => event.type);

    expect(eventTypes).toEqual(
      expect.arrayContaining([
        "timeHeader",
        "message",
        "typingStart",
        "typingStop",
        "composeStart",
        "keyPress",
        "flooentlyActivate",
        "flooentlyLoading",
        "flooentlyResult",
        "delivered",
      ]),
    );

    const composeStartFrame = Math.ceil(
      script.conversation.events
        .slice(0, eventTypes.indexOf("keyPress") + 1)
        .reduce((total, event) => total + event.delay, 0) * 30,
    );
    const composing = getSimulatorSnapshot(script, composeStartFrame + 3);

    expect(composing.composeActive).toBe(true);
    expect(composing.composeText.length).toBeGreaterThan(0);
    expect(composing.highlightedKey).toBeTruthy();

    const finished = getSimulatorSnapshot(
      script,
      getScriptDurationInFrames(script) - 10,
    );
    const outgoing = finished.items.filter(
      (item): item is ThreadBubble =>
        item.type === "bubble" && item.sender === "me",
    );

    expect(finished.flooentlyActive).toBe(true);
    expect(outgoing.at(-1)?.showDelivered || outgoing.at(-1)?.showRead).toBe(
      true,
    );
  });
});
