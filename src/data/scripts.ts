import { buildSourceConversation } from "./conversation";
import { EDITABLE_FLOOENTLY_SCRIPTS } from "./editableScripts";
import type { Message, TimelineMessage, VideoScript } from "./types";
import { VIDEO_FPS } from "./types";

export * from "./types";
export { buildSourceConversation } from "./conversation";
export { EDITABLE_FLOOENTLY_SCRIPTS } from "./editableScripts";
export {
  autocompleteForText,
  getSimulatorSnapshot,
  isLastThreadBubbleInGroup,
} from "./simulator";

const TYPING_FRAMES = 28;
const MESSAGE_GAP_FRAMES = 12;
const INTRO_FRAMES = 42;
const OUTRO_HOLD_FRAMES = 90;

export const FLOOENTLY_SCRIPTS: VideoScript[] = EDITABLE_FLOOENTLY_SCRIPTS.map(
  (script) => ({
    ...script,
    conversation: buildSourceConversation(script),
  }),
);

export function getScriptById(id: string): VideoScript {
  const script = FLOOENTLY_SCRIPTS.find((candidate) => candidate.id === id);

  if (!script) {
    throw new Error(`Unknown Flooently script: ${id}`);
  }

  return script;
}

export function getScriptTimeline(script: VideoScript): TimelineMessage[] {
  let cursor = INTRO_FRAMES;

  return script.messages.map((message, index) => {
    const typingDurationFrames = message.showTypingBefore ? TYPING_FRAMES : 0;
    const typingStartFrame = message.showTypingBefore ? cursor : undefined;
    const messageStartFrame = cursor + typingDurationFrames;
    const messageDurationFrames = getMessageDurationInFrames(message);

    cursor =
      messageStartFrame +
      messageDurationFrames +
      (message.delayAfter ?? MESSAGE_GAP_FRAMES);

    return {
      message,
      index,
      typingStartFrame,
      typingDurationFrames,
      messageStartFrame,
      messageDurationFrames,
    };
  });
}

export function getScriptDurationInFrames(script: VideoScript): number {
  const seconds = script.conversation.events.reduce(
    (total, event) => total + event.delay,
    0,
  );

  return Math.ceil(seconds * VIDEO_FPS) + OUTRO_HOLD_FRAMES;
}

export function isLastInSenderRun(messages: Message[], index: number): boolean {
  const current = messages[index];
  const next = messages[index + 1];

  if (!current) {
    return true;
  }

  return !next || next.side !== current.side;
}

function getMessageDurationInFrames(message: Message): number {
  const base = 28;
  const reading = Math.ceil(message.text.length * 0.95);

  return clamp(base + reading, 35, 82);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
