import { create } from 'zustand';
import { Message } from '../types/message';

interface ChatState {
  // Chat messages by chat ID
  chatMessages: { [chatId: string]: Message[] };

  // Actions
  setChatMessages: (chatId: string, messages: Message[]) => void;
  addMessage: (chatId: string, message: Message) => void;
  updateMessage: (
    chatId: string,
    messageId: string,
    updates: Partial<Message>
  ) => void;
  clearChat: (chatId: string) => void;
  clearAllChats: () => void;

  // Get messages for a specific chat
  getMessages: (chatId: string) => Message[];
}

export const useChatStore = create<ChatState>((set, get) => ({
  chatMessages: {},

  setChatMessages: (chatId: string, messages: Message[]) =>
    set(state => ({
      chatMessages: {
        ...state.chatMessages,
        [chatId]: messages,
      },
    })),

  addMessage: (chatId: string, message: Message) =>
    set(state => ({
      chatMessages: {
        ...state.chatMessages,
        [chatId]: [...(state.chatMessages[chatId] || []), message],
      },
    })),

  updateMessage: (
    chatId: string,
    messageId: string,
    updates: Partial<Message>
  ) =>
    set(state => ({
      chatMessages: {
        ...state.chatMessages,
        [chatId]: (state.chatMessages[chatId] || []).map(msg =>
          msg.id === messageId ? ({ ...msg, ...updates } as Message) : msg
        ),
      },
    })),

  clearChat: (chatId: string) =>
    set(state => ({
      chatMessages: {
        ...state.chatMessages,
        [chatId]: [],
      },
    })),

  clearAllChats: () =>
    set(() => ({
      chatMessages: {},
    })),

  getMessages: (chatId: string) => {
    const state = get();
    return state.chatMessages[chatId] || [];
  },
}));
