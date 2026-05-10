import { getReactionEmoji } from '../reactions';

describe('getReactionEmoji', () => {
  it.each([
    ['heart', '❤️'],
    ['thumbsUp', '👍'],
    ['haha', '😂'],
    ['doubleExclamation', '‼️'],
  ] as const)('maps %s to %s', (type, expected) => {
    expect(getReactionEmoji(type)).toBe(expected);
  });
});
