import type {
  EditableVideoScript,
  Message,
  ScriptEvent,
  Sender,
  SourceConversationScript,
} from "./types";
import { VIDEO_FPS } from "./types";

const MESSAGE_GAP_FRAMES = 12;

export function buildSourceConversation(
  script: EditableVideoScript,
): SourceConversationScript {
  const events: ScriptEvent[] = [
    {
      delay: 0.3,
      event: { type: "timeHeader", text: script.timeHeader },
    },
  ];
  const finalOutgoingIndex = findFinalOutgoingIndex(script.messages);

  script.messages.forEach((message, index) => {
    if (index === finalOutgoingIndex) {
      return;
    }

    if (message.showTypingBefore) {
      events.push(
        { delay: 0.8, event: { type: "typingStart", sender: "them" } },
        { delay: 0.9, event: { type: "typingStop", sender: "them" } },
      );
    }

    events.push({
      delay: Math.max(
        0.25,
        (message.delayAfter ?? MESSAGE_GAP_FRAMES) / VIDEO_FPS,
      ),
      event: {
        type: "message",
        sender: sideToSender(message.side),
        text: message.text,
      },
    });
  });

  events.push(
    { delay: 0.8, event: { type: "composeStart" } },
    {
      delay: 0.25,
      event: {
        type: "flooentlyActivate",
        flooentlyMode: script.keyboardDemo.mode,
        flooentlyLanguage: script.keyboardDemo.language,
      },
    },
  );

  for (const key of keysForText(script.keyboardDemo.composeText)) {
    events.push({
      delay: key === "space" ? 0.11 : 0.075,
      event: { type: "keyPress", key },
    });
  }

  events.push(
    { delay: 0.65, event: { type: "flooentlyLoading" } },
    {
      delay: 1.1,
      event: {
        type: "flooentlyResult",
        text: script.keyboardDemo.resultText,
        flooentlyOriginal: script.keyboardDemo.composeText,
        flooentlyNuggets: [
          {
            category: "Rewrite",
            title: script.keyboardDemo.resultTitle,
            body: script.keyboardDemo.resultText,
          },
          {
            category: "Tone",
            title: "Natural and useful",
            body: "Keeps the meaning, removes friction, and avoids overclaiming.",
          },
        ],
      },
    },
  );

  const finalOutgoing =
    finalOutgoingIndex >= 0 ? script.messages[finalOutgoingIndex] : undefined;

  if (finalOutgoing) {
    events.push(
      { delay: 1.0, event: { type: "flooentlyDismiss" } },
      {
        delay: 0.45,
        event: {
          type: "message",
          sender: "me",
          text: finalOutgoing.text,
        },
      },
      {
        delay: 0.9,
        event: {
          type: finalOutgoing.receipt === "Read" ? "read" : "delivered",
        },
      },
    );
  }

  events.push({ delay: 1.2, event: { type: "pause" } });

  return {
    title: script.id,
    showReadReceipts: true,
    events,
  };
}

function findFinalOutgoingIndex(messages: Message[]): number {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index]?.side === "right") {
      return index;
    }
  }

  return -1;
}

function sideToSender(side: Message["side"]): Sender {
  return side === "right" ? "me" : "them";
}

function keysForText(text: string): string[] {
  return Array.from(text).map((character) =>
    character === " " ? "space" : character,
  );
}
