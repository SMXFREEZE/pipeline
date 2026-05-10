import { Message } from '../../types/message';
import {
  shouldShowTimestamp,
  isLastInGroup,
  shouldAddGroupSpacing,
  isFirstInGroup,
  createMessage,
  createAppleMusicMessage,
} from '../messageUtils';

const text = (id: string, isSender: boolean, timestamp: string): Message => ({
  id,
  text: 'msg',
  isSender,
  timestamp,
  type: 'text',
});

describe('messageUtils', () => {
  describe('shouldShowTimestamp', () => {
    it('always shows for first message', () => {
      const messages = [text('1', true, '10:00 AM')];
      expect(shouldShowTimestamp(messages, 0)).toBe(true);
    });

    it('hides when messages are <15 minutes apart', () => {
      const messages = [
        text('1', true, '10:00 AM'),
        text('2', true, '10:14 AM'),
      ];
      expect(shouldShowTimestamp(messages, 1)).toBe(false);
    });

    it('shows when messages are exactly 15 minutes apart', () => {
      const messages = [
        text('1', true, '10:00 AM'),
        text('2', true, '10:15 AM'),
      ];
      expect(shouldShowTimestamp(messages, 1)).toBe(true);
    });

    it('shows when messages are >15 minutes apart', () => {
      const messages = [
        text('1', true, '10:00 AM'),
        text('2', false, '11:00 AM'),
      ];
      expect(shouldShowTimestamp(messages, 1)).toBe(true);
    });
  });

  describe('isFirstInGroup', () => {
    it('treats the first message as first in group', () => {
      const messages = [text('1', true, '10:00 AM')];
      expect(isFirstInGroup(messages, 0)).toBe(true);
    });

    it('returns true when previous message has a different sender', () => {
      const messages = [
        text('1', true, '10:00 AM'),
        text('2', false, '10:01 AM'),
      ];
      expect(isFirstInGroup(messages, 1)).toBe(true);
    });

    it('returns false for consecutive messages from same sender within 15 min', () => {
      const messages = [
        text('1', true, '10:00 AM'),
        text('2', true, '10:05 AM'),
      ];
      expect(isFirstInGroup(messages, 1)).toBe(false);
    });

    it('returns true when there is a 15+ minute gap from same sender', () => {
      const messages = [
        text('1', true, '10:00 AM'),
        text('2', true, '10:30 AM'),
      ];
      expect(isFirstInGroup(messages, 1)).toBe(true);
    });
  });

  describe('isLastInGroup', () => {
    it('treats the last message as last in group', () => {
      const messages = [
        text('1', true, '10:00 AM'),
        text('2', true, '10:01 AM'),
      ];
      expect(isLastInGroup(messages, 1)).toBe(true);
    });

    it('returns true when next message is from a different sender', () => {
      const messages = [
        text('1', true, '10:00 AM'),
        text('2', false, '10:01 AM'),
      ];
      expect(isLastInGroup(messages, 0)).toBe(true);
    });

    it('returns false in the middle of a same-sender run', () => {
      const messages = [
        text('1', true, '10:00 AM'),
        text('2', true, '10:01 AM'),
        text('3', true, '10:02 AM'),
      ];
      expect(isLastInGroup(messages, 0)).toBe(false);
      expect(isLastInGroup(messages, 1)).toBe(false);
      expect(isLastInGroup(messages, 2)).toBe(true);
    });

    it('returns true when next message has a 15+ min gap', () => {
      const messages = [
        text('1', true, '10:00 AM'),
        text('2', true, '10:30 AM'),
      ];
      expect(isLastInGroup(messages, 0)).toBe(true);
    });
  });

  describe('shouldAddGroupSpacing', () => {
    it('returns false for the first message', () => {
      const messages = [text('1', true, '10:00 AM')];
      expect(shouldAddGroupSpacing(messages, 0)).toBe(false);
    });

    it('returns true on sender change', () => {
      const messages = [
        text('1', true, '10:00 AM'),
        text('2', false, '10:01 AM'),
      ];
      expect(shouldAddGroupSpacing(messages, 1)).toBe(true);
    });

    it('returns false within a same-sender burst', () => {
      const messages = [
        text('1', true, '10:00 AM'),
        text('2', true, '10:01 AM'),
      ];
      expect(shouldAddGroupSpacing(messages, 1)).toBe(false);
    });

    it('returns true when a timestamp gap appears between same-sender messages', () => {
      const messages = [
        text('1', true, '10:00 AM'),
        text('2', true, '10:30 AM'),
      ];
      expect(shouldAddGroupSpacing(messages, 1)).toBe(true);
    });
  });

  describe('createMessage', () => {
    it('creates a text message with provided text and default sender', () => {
      const msg = createMessage('hi');
      expect(msg.type).toBe('text');
      expect(msg.text).toBe('hi');
      expect(msg.isSender).toBe(true);
      expect(msg.showDelivered).toBe(false);
      expect(typeof msg.id).toBe('string');
      expect(msg.timestamp).toMatch(/\d{1,2}:\d{2}/);
    });

    it('respects isSender = false', () => {
      const msg = createMessage('hey', false);
      expect(msg.isSender).toBe(false);
    });
  });

  describe('createAppleMusicMessage', () => {
    const songData = {
      songId: 'abc',
      songTitle: 'Mr. Brightside',
      artistName: 'The Killers',
      albumArtUrl: 'http://example.com/art.png',
    };

    it('creates an appleMusic message and stores fallback text', () => {
      const msg = createAppleMusicMessage(songData);
      expect(msg.type).toBe('appleMusic');
      expect(msg.songId).toBe('abc');
      expect(msg.text).toBe('Mr. Brightside by The Killers');
      expect(msg.isSender).toBe(true);
    });

    it('includes caption when provided', () => {
      const msg = createAppleMusicMessage(songData, true, 'check this out');
      expect(msg.caption).toBe('check this out');
    });

    it('omits caption when not provided', () => {
      const msg = createAppleMusicMessage(songData);
      expect('caption' in msg).toBe(false);
    });
  });
});
