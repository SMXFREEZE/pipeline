import { Message, TextMessage, AppleMusicMessage } from '../types/message';

/**
 * Check if we should show timestamp between messages
 * Shows timestamp for first message or if messages are 15+ minutes apart
 */
export const shouldShowTimestamp = (
  messages: Message[],
  currentIndex: number
): boolean => {
  if (currentIndex === 0) return true; // Always show for first message

  const currentMessage = messages[currentIndex];
  const previousMessage = messages[currentIndex - 1];

  // Parse timestamps to check if they're more than 15 minutes apart
  const currentTime = new Date(`2024-01-01 ${currentMessage.timestamp}`);
  const previousTime = new Date(`2024-01-01 ${previousMessage.timestamp}`);

  const timeDiff = currentTime.getTime() - previousTime.getTime();
  const minutesDiff = timeDiff / (1000 * 60);

  return minutesDiff >= 15;
};

/**
 * Check if message is the last in its group
 * A message is last in group if it's the final message or next message is from different sender
 */
export const isLastInGroup = (
  messages: Message[],
  currentIndex: number
): boolean => {
  const currentMessage = messages[currentIndex];
  const nextMessage = messages[currentIndex + 1];

  // If it's the last message overall, it's last in group
  if (!nextMessage) return true;

  // If next message is from different sender, current is last in group
  if (currentMessage.isSender !== nextMessage.isSender) return true;

  // If there's a timestamp between current and next, current is last in group
  return shouldShowTimestamp(messages, currentIndex + 1);
};

/**
 * Check if we should add spacing before a message (start of new group)
 * Adds spacing when sender changes or there's a timestamp between messages
 */
export const shouldAddGroupSpacing = (
  messages: Message[],
  currentIndex: number
): boolean => {
  if (currentIndex === 0) return false; // No spacing before first message

  const currentMessage = messages[currentIndex];
  const previousMessage = messages[currentIndex - 1];

  // Add spacing if sender changes (new conversation group)
  if (currentMessage.isSender !== previousMessage.isSender) return true;

  // Add spacing if there's a timestamp between messages
  return shouldShowTimestamp(messages, currentIndex);
};

/**
 * Check if message is the first in its group
 * A message is first in group if it's the initial message or previous message is from different sender
 */
export const isFirstInGroup = (
  messages: Message[],
  currentIndex: number
): boolean => {
  const currentMessage = messages[currentIndex];
  const previousMessage = messages[currentIndex - 1];

  // If it's the first message overall, it's first in group
  if (!previousMessage) return true;

  // If previous message is from different sender, current is first in group
  if (currentMessage.isSender !== previousMessage.isSender) return true;

  // If there's a timestamp between previous and current, current is first in group
  return shouldShowTimestamp(messages, currentIndex);
};

/**
 * Create a new text message with current timestamp
 */
const createTextMessage = (
  text: string,
  isSender: boolean = true
): TextMessage => {
  return {
    id: Date.now().toString(),
    text,
    isSender,
    timestamp: new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }),
    showDelivered: false,
    type: 'text',
  };
};

/**
 * Create a new Apple Music message
 */
export const createAppleMusicMessage = (
  songData: {
    songId: string;
    songTitle: string;
    artistName: string;
    albumArtUrl: string;
    duration?: number;
  },
  isSender: boolean = true,
  caption?: string
): AppleMusicMessage => {
  return {
    id: Date.now().toString(),
    isSender,
    timestamp: new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }),
    showDelivered: false,
    type: 'appleMusic',
    text: `${songData.songTitle} by ${songData.artistName}`, // fallback text
    ...(caption ? { caption } : {}),
    ...songData,
  };
};

/**
 * Create a new message with current timestamp (backward compatibility)
 */
export const createMessage = (
  text: string,
  isSender: boolean = true
): Message => {
  return createTextMessage(text, isSender);
};
