import { useChatStore } from '../chatStore';
import { Message } from '../../types/message';

const text = (id: string): Message => ({
  id,
  text: `msg-${id}`,
  isSender: true,
  timestamp: '10:00 AM',
  type: 'text',
});

beforeEach(() => {
  useChatStore.getState().clearAllChats();
});

describe('chatStore', () => {
  it('starts with no messages for any chat', () => {
    expect(useChatStore.getState().getMessages('chat-1')).toEqual([]);
  });

  it('setChatMessages replaces the message list for a chat', () => {
    const { setChatMessages, getMessages } = useChatStore.getState();
    setChatMessages('chat-1', [text('a'), text('b')]);
    expect(getMessages('chat-1').map(m => m.id)).toEqual(['a', 'b']);

    setChatMessages('chat-1', [text('c')]);
    expect(getMessages('chat-1').map(m => m.id)).toEqual(['c']);
  });

  it('addMessage appends to the right chat without affecting others', () => {
    const { addMessage, getMessages } = useChatStore.getState();
    addMessage('chat-1', text('a'));
    addMessage('chat-2', text('b'));
    addMessage('chat-1', text('c'));

    expect(getMessages('chat-1').map(m => m.id)).toEqual(['a', 'c']);
    expect(getMessages('chat-2').map(m => m.id)).toEqual(['b']);
  });

  it('updateMessage merges partial updates onto a single message', () => {
    const { addMessage, updateMessage, getMessages } = useChatStore.getState();
    addMessage('chat-1', text('a'));
    addMessage('chat-1', text('b'));

    updateMessage('chat-1', 'b', { showDelivered: true });

    const [a, b] = getMessages('chat-1');
    expect(a.showDelivered).toBeUndefined();
    expect(b.showDelivered).toBe(true);
  });

  it('updateMessage is a no-op when the message id is missing', () => {
    const { addMessage, updateMessage, getMessages } = useChatStore.getState();
    addMessage('chat-1', text('a'));
    updateMessage('chat-1', 'missing', { showDelivered: true });
    expect(getMessages('chat-1')[0].showDelivered).toBeUndefined();
  });

  it('clearChat empties one chat but leaves others alone', () => {
    const { addMessage, clearChat, getMessages } = useChatStore.getState();
    addMessage('chat-1', text('a'));
    addMessage('chat-2', text('b'));

    clearChat('chat-1');

    expect(getMessages('chat-1')).toEqual([]);
    expect(getMessages('chat-2').map(m => m.id)).toEqual(['b']);
  });

  it('clearAllChats wipes all chat state', () => {
    const { addMessage, clearAllChats, getMessages } = useChatStore.getState();
    addMessage('chat-1', text('a'));
    addMessage('chat-2', text('b'));

    clearAllChats();

    expect(getMessages('chat-1')).toEqual([]);
    expect(getMessages('chat-2')).toEqual([]);
  });
});
