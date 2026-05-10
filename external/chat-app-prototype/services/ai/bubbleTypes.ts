import { AI_RESPONSE_FORMATS, MUSIC_RESPONSE_FORMATS } from './constants';

interface BubbleTypeConfig {
  type: string;
  formatKey: string;
  triggers: string[];
  negativeContext: string[];
  responseFormat: string;
  examples: {
    trigger: string;
    response: string;
  }[];
  parser?: (content: string) => any;
}

export const BUBBLE_TYPES: Record<string, BubbleTypeConfig> = {
  TEXT: {
    type: 'text',
    formatKey: AI_RESPONSE_FORMATS.responseTypes.text,
    triggers: [], // Default fallback
    negativeContext: [],
    responseFormat:
      '[Your casual, friendly response - 1-2 sentences max, like a text message]',
    examples: [
      {
        trigger: 'Hey!',
        response: "Hey! What's up?",
      },
      {
        trigger: 'Have you seen Sinners?',
        response: 'Not yet! Is it good?',
      },
      {
        trigger: "I'm bored",
        response: 'Same tbh. Wanna hang out?',
      },
      {
        trigger: 'What are you doing this weekend?',
        response: 'Not much planned yet. You?',
      },
    ],
  },
  MUSIC: {
    type: 'music',
    formatKey: AI_RESPONSE_FORMATS.responseTypes.music,
    triggers: [
      'send me a song',
      'play a song',
      'send me music',
      'what should I listen to',
      'favorite .* song',
      'know any .* songs',
      'play something',
      'recommend.*music',
      'recommend.*song',
      'what.*favorite.*artist',
    ],
    negativeContext: [
      'bird song',
      'song and dance',
      'same old song',
      'swan song',
    ],
    responseFormat: `[One short reaction]
${MUSIC_RESPONSE_FORMATS.queryPrefix}[search query]`,
    examples: [
      {
        trigger: 'Send me a good song',
        response: `This one's been on repeat!
${MUSIC_RESPONSE_FORMATS.queryPrefix}search:flowers miley cyrus`,
      },
      {
        trigger: 'Play something upbeat',
        response: `Perfect energy boost!
${MUSIC_RESPONSE_FORMATS.queryPrefix}search:levitating dua lipa`,
      },
      {
        trigger: "What's your favorite Taylor Swift song?",
        response: `Love this one from her!
${MUSIC_RESPONSE_FORMATS.queryPrefix}search:anti hero taylor swift`,
      },
    ],
  },
  // Easy to add new bubble types here:
  // LOCATION: {
  //   type: 'location',
  //   formatKey: 'LOCATION_RESPONSE',
  //   triggers: [
  //     'where are you',
  //     'send.*location',
  //     'share.*location',
  //     'what.*address',
  //   ],
  //   negativeContext: ['location in the code', 'memory location'],
  //   responseFormat: '[Location name or description]\nLOCATION_DATA:[coordinates or address]',
  //   examples: [
  //     {
  //       trigger: 'Where are you?',
  //       response: 'At the coffee shop!\nLOCATION_DATA:37.7749,-122.4194',
  //     },
  //   ],
  // },
};
