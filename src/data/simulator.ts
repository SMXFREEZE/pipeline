import type {
  ConversationEventPayload,
  SimulatorSnapshot,
  ThreadItem,
  VideoScript,
} from "./types";
import { VIDEO_FPS } from "./types";

export { autocompleteForText } from "./autocomplete";

const KEY_FLASH_FRAMES = 3;

export function isLastThreadBubbleInGroup(
  items: ThreadItem[],
  index: number,
): boolean {
  const current = items[index];

  if (!current || current.type !== "bubble") {
    return true;
  }

  const next = items[index + 1];

  return !next || next.type !== "bubble" || next.sender !== current.sender;
}

export function getSimulatorSnapshot(
  script: VideoScript,
  frame: number,
): SimulatorSnapshot {
  const state = createInitialSnapshot();
  let elapsedSeconds = 0;

  for (const scriptEvent of script.conversation.events) {
    elapsedSeconds += scriptEvent.delay;
    const eventFrame = Math.round(elapsedSeconds * VIDEO_FPS);

    if (eventFrame > frame) {
      break;
    }

    applySimulatorEvent(state, scriptEvent.event, eventFrame);

    const highlightedKey = highlightedKeyForEvent(scriptEvent.event);
    if (
      highlightedKey &&
      frame >= eventFrame &&
      frame < eventFrame + KEY_FLASH_FRAMES
    ) {
      state.highlightedKey = highlightedKey;
    }
  }

  return state;
}

function createInitialSnapshot(): SimulatorSnapshot {
  return {
    items: [],
    themTyping: false,
    meTyping: false,
    composeText: "",
    composeActive: false,
    flooentlyActive: false,
    flooentlyMode: "improve",
    flooentlyLanguage: "English",
    flooentlyLanguageFlag: "US",
    flooentlyLanguageCode: "EN",
    flooentlyShowResults: false,
    flooentlyIsLoading: false,
    flooentlyNuggets: [],
    flooentlyNuggetIndex: 0,
    flooentlySwipeProgress: 0,
    flooentlySwipingToIndex: 0,
  };
}

function applySimulatorEvent(
  state: SimulatorSnapshot,
  event: ConversationEventPayload,
  eventFrame: number,
) {
  switch (event.type) {
    case "message":
      applyMessageEvent(state, event, eventFrame);
      break;
    case "typingStart":
      applyTypingStart(state, event);
      break;
    case "typingStop":
      applyTypingStop(state, event);
      break;
    case "read":
      clearDelivered(state);
      markLastOutgoing(state, "read");
      break;
    case "delivered":
      markLastOutgoing(state, "delivered");
      break;
    case "timeHeader":
      if (event.text) {
        state.items.push({
          type: "timeHeader",
          id: `header-${event.text}-${eventFrame}`,
          text: event.text,
        });
      }
      break;
    case "linkPreview":
      if (event.sender) {
        state.items.push({
          type: "linkPreview",
          id: `preview-${state.items.length}-${eventFrame}`,
          sender: event.sender,
          title: event.linkTitle ?? "Link",
          subtitle: event.linkSubtitle ?? "",
        });
      }
      break;
    case "composeStart":
      state.composeActive = true;
      break;
    case "composeText":
      state.composeText = event.text ?? "";
      break;
    case "composeClear":
      state.composeText = "";
      state.composeActive = false;
      break;
    case "keyPress":
      applyKeyPress(state, event.key);
      break;
    case "autocomplete":
      applyAutocomplete(state, event.text);
      break;
    case "flooentlyActivate":
      applyFlooentlyActivate(state, event);
      break;
    case "flooentlyLoading":
      state.flooentlyShowResults = true;
      state.flooentlyIsLoading = true;
      break;
    case "flooentlyResult":
      applyFlooentlyResult(state, event);
      break;
    case "flooentlyDismiss":
      clearFlooentlyResult(state);
      break;
    case "flooentlyModeSwitch":
      if (event.flooentlyMode) {
        state.flooentlyMode = event.flooentlyMode;
      }
      break;
    case "flooentlyLanguageSwitch":
      if (event.flooentlyLanguage) {
        setFlooentlyLanguage(state, event.flooentlyLanguage);
      }
      break;
    case "flooentlySwipe":
      applyFlooentlySwipe(state);
      break;
    case "pause":
      break;
  }
}

function applyMessageEvent(
  state: SimulatorSnapshot,
  event: ConversationEventPayload,
  eventFrame: number,
) {
  if (!event.sender || !event.text) {
    return;
  }

  if (event.sender === "them") {
    state.themTyping = false;
  } else {
    state.meTyping = false;
    state.composeText = "";
    clearDelivered(state);
  }

  state.items.push({
    type: "bubble",
    id: `bubble-${state.items.length}-${eventFrame}`,
    sender: event.sender,
    text: event.text,
    appearFrame: eventFrame,
    showRead: false,
    showDelivered: false,
  });
}

function applyTypingStart(
  state: SimulatorSnapshot,
  event: ConversationEventPayload,
) {
  if (event.sender === "them") {
    state.themTyping = true;
    clearDelivered(state);
    markLastOutgoing(state, "read");
  } else if (event.sender === "me") {
    state.meTyping = true;
  }
}

function applyTypingStop(
  state: SimulatorSnapshot,
  event: ConversationEventPayload,
) {
  if (event.sender === "them") {
    state.themTyping = false;
  } else if (event.sender === "me") {
    state.meTyping = false;
  }
}

function applyKeyPress(state: SimulatorSnapshot, key?: string) {
  if (!key) {
    return;
  }

  switch (key) {
    case "backspace":
      state.composeText = state.composeText.slice(0, -1);
      break;
    case "space":
      state.composeText += " ";
      break;
    case "return":
      break;
    default:
      state.composeText += key;
      break;
  }
}

function applyAutocomplete(state: SimulatorSnapshot, word?: string) {
  if (!word) {
    return;
  }

  const parts = state.composeText.split(" ");
  parts.pop();
  state.composeText = [...parts, word].filter(Boolean).join(" ") + " ";
}

function applyFlooentlyActivate(
  state: SimulatorSnapshot,
  event: ConversationEventPayload,
) {
  state.flooentlyActive = true;
  state.composeActive = true;

  if (event.flooentlyMode) {
    state.flooentlyMode = event.flooentlyMode;
  }

  if (event.flooentlyLanguage) {
    setFlooentlyLanguage(state, event.flooentlyLanguage);
  }
}

function applyFlooentlyResult(
  state: SimulatorSnapshot,
  event: ConversationEventPayload,
) {
  state.flooentlyShowResults = true;
  state.flooentlyIsLoading = false;
  state.flooentlyOriginal = event.flooentlyOriginal;
  state.flooentlyResult = event.text;
  state.composeText = event.text ?? state.composeText;
  state.flooentlyNuggets = event.flooentlyNuggets ?? [];
  state.flooentlyNuggetIndex = 0;
}

function clearFlooentlyResult(state: SimulatorSnapshot) {
  state.flooentlyShowResults = false;
  state.flooentlyIsLoading = false;
  state.flooentlyOriginal = undefined;
  state.flooentlyResult = undefined;
  state.flooentlyNuggets = [];
  state.flooentlyNuggetIndex = 0;
}

function applyFlooentlySwipe(state: SimulatorSnapshot) {
  if (
    state.flooentlyNuggets.length > 0 &&
    state.flooentlyNuggetIndex < state.flooentlyNuggets.length - 1
  ) {
    state.flooentlySwipingToIndex = state.flooentlyNuggetIndex + 1;
    state.flooentlyNuggetIndex += 1;
  }
}

function markLastOutgoing(
  state: SimulatorSnapshot,
  receipt: "delivered" | "read",
) {
  for (let index = state.items.length - 1; index >= 0; index -= 1) {
    const item = state.items[index];
    if (item?.type === "bubble" && item.sender === "me") {
      if (receipt === "read") {
        item.showRead = true;
        item.showDelivered = false;
      } else {
        item.showDelivered = true;
      }
      return;
    }
  }
}

function clearDelivered(state: SimulatorSnapshot) {
  for (const item of state.items) {
    if (item.type === "bubble") {
      item.showDelivered = false;
    }
  }
}

function setFlooentlyLanguage(
  state: SimulatorSnapshot,
  languageName: string,
) {
  const resolvedName = LANGUAGE_ALIASES[languageName] ?? languageName;
  const language = LANGUAGES[resolvedName] ?? LANGUAGES.English;

  state.flooentlyLanguage = resolvedName;
  state.flooentlyLanguageFlag = language.flag;
  state.flooentlyLanguageCode = language.code;
}

function highlightedKeyForEvent(
  event: ConversationEventPayload,
): string | undefined {
  if (event.type !== "keyPress" || !event.key) {
    return undefined;
  }

  if (event.key === "space") {
    return "space";
  }

  if (event.key === "backspace") {
    return "backspace";
  }

  return event.key.toUpperCase();
}

const LANGUAGES: Record<string, { flag: string; code: string }> = {
  English: { flag: "US", code: "EN" },
  Spanish: { flag: "ES", code: "ES" },
  French: { flag: "FR", code: "FR" },
  German: { flag: "DE", code: "DE" },
  Portuguese: { flag: "BR", code: "PT" },
  Italian: { flag: "IT", code: "IT" },
  Japanese: { flag: "JP", code: "JA" },
  Korean: { flag: "KR", code: "KO" },
  Chinese: { flag: "CN", code: "ZH" },
  Ukrainian: { flag: "UA", code: "UK" },
};

const LANGUAGE_ALIASES: Record<string, string> = {
  EN: "English",
  ES: "Spanish",
  FR: "French",
  PT: "Portuguese",
  IT: "Italian",
};
