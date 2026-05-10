import { describe, expect, it } from "vitest";
import { VIDEO_FPS, getScriptById } from "../src/data/scripts";
import {
  autocompleteForText,
  getSimulatorSnapshot,
  isLastThreadBubbleInGroup,
} from "../src/data/simulator";
import type { ThreadBubble, ThreadItem, VideoScript } from "../src/data/types";

function eventFrameAt(scriptId: string, eventIndex: number): number {
  const script = getScriptById(scriptId);
  const seconds = script.conversation.events
    .slice(0, eventIndex + 1)
    .reduce((total, item) => total + item.delay, 0);

  return Math.round(seconds * VIDEO_FPS);
}

describe("Flooently source simulator state machine", () => {
  it("builds source-compatible event scripts with ordered compose and Flooently phases", () => {
    const script = getScriptById("french-natural-text");
    const eventTypes = script.conversation.events.map(({ event }) => event.type);

    expect(eventTypes[0]).toBe("timeHeader");
    expect(eventTypes.indexOf("composeStart")).toBeLessThan(
      eventTypes.indexOf("flooentlyActivate"),
    );
    expect(eventTypes.indexOf("flooentlyActivate")).toBeLessThan(
      eventTypes.indexOf("keyPress"),
    );
    expect(eventTypes.indexOf("keyPress")).toBeLessThan(
      eventTypes.indexOf("flooentlyLoading"),
    );
    expect(eventTypes.indexOf("flooentlyLoading")).toBeLessThan(
      eventTypes.indexOf("flooentlyResult"),
    );
    expect(eventTypes.indexOf("flooentlyDismiss")).toBeLessThan(
      eventTypes.lastIndexOf("message"),
    );
    expect(eventTypes.at(-1)).toBe("pause");

    expect(script.conversation.events.every((item) => item.delay >= 0)).toBe(
      true,
    );

    const activeFrame = eventFrameAt(
      script.id,
      eventTypes.indexOf("flooentlyActivate"),
    );
    const activeSnapshot = getSimulatorSnapshot(script, activeFrame);

    expect(activeSnapshot.flooentlyLanguageCode).toBe("FR");
    expect(activeSnapshot.flooentlyLanguageFlag).toBe("FR");
  });

  it("applies keypress events and clears key highlight after the source flash window", () => {
    const script: VideoScript = {
      id: "keypress-test",
      title: "Keypress test",
      contactName: "Flooently",
      hook: "Test",
      timeHeader: "Today 13:11",
      keyboardDemo: {
        composeText: "m",
        suggestions: ["m", "me", "my"],
        mode: "improve",
        language: "EN",
        resultTitle: "Result",
        resultText: "Result",
      },
      messages: [],
      conversation: {
        title: "keypress-test",
        showReadReceipts: true,
        events: [
          { delay: 0, event: { type: "composeStart" } },
          { delay: 1, event: { type: "keyPress", key: "m" } },
          { delay: 1, event: { type: "pause" } },
        ],
      },
    };
    const frame = VIDEO_FPS;

    const duringFlash = getSimulatorSnapshot(script, frame);
    const afterFlash = getSimulatorSnapshot(script, frame + 3);

    expect(duringFlash.composeActive).toBe(true);
    expect(duringFlash.composeText).toBe("m");
    expect(duringFlash.highlightedKey).toBe("M");
    expect(afterFlash.composeText).toBe("m");
    expect(afterFlash.highlightedKey).toBeUndefined();
  });

  it("keeps outgoing receipts mutually exclusive and attached to the last outgoing bubble", () => {
    const script = getScriptById("spanish-reply-panic");
    const finalSnapshot = getSimulatorSnapshot(
      script,
      eventFrameAt(script.id, script.conversation.events.length - 1),
    );
    const outgoing = finalSnapshot.items.filter(
      (item): item is ThreadBubble =>
        item.type === "bubble" && item.sender === "me",
    );
    const lastOutgoing = outgoing.at(-1);
    const scriptedReceiptBubble = script.messages
      .filter((message) => message.side === "right")
      .at(-1);

    expect(lastOutgoing?.text).toBe(scriptedReceiptBubble?.text);
    expect(lastOutgoing?.showRead).toBe(true);
    expect(lastOutgoing?.showDelivered).toBe(false);
  });

  it("treats headers and link previews as bubble-group boundaries for tails", () => {
    const items: ThreadItem[] = [
      {
        type: "bubble",
        id: "1",
        sender: "them",
        text: "first",
        appearFrame: 0,
        showDelivered: false,
        showRead: false,
      },
      {
        type: "bubble",
        id: "2",
        sender: "them",
        text: "second",
        appearFrame: 1,
        showDelivered: false,
        showRead: false,
      },
      { type: "timeHeader", id: "h", text: "Today 13:11" },
      {
        type: "bubble",
        id: "3",
        sender: "me",
        text: "third",
        appearFrame: 2,
        showDelivered: false,
        showRead: false,
      },
      {
        type: "linkPreview",
        id: "p",
        sender: "me",
        title: "Home Page",
        subtitle: "example.com",
      },
    ];

    expect(isLastThreadBubbleInGroup(items, 0)).toBe(false);
    expect(isLastThreadBubbleInGroup(items, 1)).toBe(true);
    expect(isLastThreadBubbleInGroup(items, 3)).toBe(true);
  });

  it("keeps autocomplete deterministic and context aware", () => {
    expect(autocompleteForText("Let me ")).toEqual(["know", "see", "be"]);
    expect(autocompleteForText("Let me kn")).toEqual(["kn", "know", "knew"]);
    expect(autocompleteForText("")).toEqual(["I", "The", "I'm"]);
  });
});
