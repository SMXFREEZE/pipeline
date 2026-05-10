export type Message = {
  side: "left" | "right";
  text: string;
  delayAfter?: number;
  showTypingBefore?: boolean;
  receipt?: "Delivered" | "Read";
};

export type Sender = "me" | "them";

export type ConversationEventType =
  | "message"
  | "typingStart"
  | "typingStop"
  | "read"
  | "delivered"
  | "timeHeader"
  | "composeStart"
  | "keyPress"
  | "autocomplete"
  | "composeText"
  | "composeClear"
  | "linkPreview"
  | "flooentlyActivate"
  | "flooentlyLoading"
  | "flooentlyResult"
  | "flooentlyDismiss"
  | "flooentlyModeSwitch"
  | "flooentlyLanguageSwitch"
  | "flooentlySwipe"
  | "pause";

export type FlooentlyNuggetPayload = {
  category: string;
  title: string;
  body: string;
};

export type ConversationEventPayload = {
  type: ConversationEventType;
  sender?: Sender;
  text?: string;
  key?: string;
  duration?: number;
  linkTitle?: string;
  linkSubtitle?: string;
  flooentlyMode?: "improve" | "translate";
  flooentlyLanguage?: string;
  flooentlyOriginal?: string;
  flooentlyNuggets?: FlooentlyNuggetPayload[];
};

export type ScriptEvent = {
  delay: number;
  event: ConversationEventPayload;
};

export type SourceConversationScript = {
  title: string;
  showReadReceipts: boolean;
  events: ScriptEvent[];
};

export type KeyboardDemo = {
  composeText: string;
  suggestions: [string, string, string];
  mode: "improve" | "translate";
  language: string;
  resultTitle: string;
  resultText: string;
};

export type VideoScript = {
  id: string;
  title: string;
  contactName: string;
  hook: string;
  timeHeader: string;
  keyboardDemo: KeyboardDemo;
  messages: Message[];
  conversation: SourceConversationScript;
  caption?: string;
};

export type EditableVideoScript = Omit<VideoScript, "conversation">;

export type TimelineMessage = {
  message: Message;
  index: number;
  typingStartFrame?: number;
  typingDurationFrames: number;
  messageStartFrame: number;
  messageDurationFrames: number;
};

export type ThreadBubble = {
  type: "bubble";
  id: string;
  sender: Sender;
  text: string;
  appearFrame: number;
  showRead: boolean;
  showDelivered: boolean;
};

export type ThreadTimeHeader = {
  type: "timeHeader";
  id: string;
  text: string;
};

export type ThreadLinkPreview = {
  type: "linkPreview";
  id: string;
  sender: Sender;
  title: string;
  subtitle: string;
};

export type ThreadItem = ThreadBubble | ThreadTimeHeader | ThreadLinkPreview;

export type SimulatorSnapshot = {
  items: ThreadItem[];
  themTyping: boolean;
  meTyping: boolean;
  composeText: string;
  composeActive: boolean;
  highlightedKey?: string;
  flooentlyActive: boolean;
  flooentlyMode: "improve" | "translate";
  flooentlyLanguage: string;
  flooentlyLanguageFlag: string;
  flooentlyLanguageCode: string;
  flooentlyShowResults: boolean;
  flooentlyIsLoading: boolean;
  flooentlyOriginal?: string;
  flooentlyResult?: string;
  flooentlyNuggets: FlooentlyNuggetPayload[];
  flooentlyNuggetIndex: number;
  flooentlySwipeProgress: number;
  flooentlySwipingToIndex: number;
};

export const VIDEO_WIDTH = 1080;
export const VIDEO_HEIGHT = 1920;
export const VIDEO_FPS = 30;

export const IMESSAGE_SIMULATOR_REFERENCE = {
  requestedUrl: "https://github.com/pdugan20/chat-app-prototype",
  branch: "main",
  sourcePath: "external/chat-app-prototype",
  sourceRendererSize: "React Native Expo iMessage prototype",
  implementation:
    "TypeScript Remotion port using the MIT-licensed chat-app-prototype interaction model with screenshot-matched dark iMessage chrome",
  importedConcepts: [
    "MIT-licensed React Native iMessage clone",
    "dark Messages-style navigation and input bars",
    "system blue outgoing bubbles",
    "dark gray incoming bubbles",
    "SVG-style bubble tails",
    "timestamp grouping",
    "native-style typing indicator",
    "75% max message width",
    "local ConversationScript event timeline",
    "frame-by-frame snapshot state machine",
    "compact iMessage composer",
    "Flooently toolbar",
    "delivery receipts",
  ],
} as const;
