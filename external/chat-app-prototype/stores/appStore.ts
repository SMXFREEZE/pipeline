import { create } from 'zustand';

interface ChatUpdate {
  id: string;
  lastMessage?: string;
  timestamp?: string;
  unread?: boolean;
  [key: string]: unknown;
}

interface AppState {
  // App-wide flags
  resetAllChats: boolean;
  forceInboxRefresh: boolean;

  // Pending chat update for inbox
  pendingChatUpdate: ChatUpdate | undefined;

  // Actions
  setResetAllChats: (reset: boolean) => void;
  setForceInboxRefresh: (force: boolean) => void;
  setPendingChatUpdate: (update: ChatUpdate | undefined) => void;

  // Reset everything (for prototype reset functionality)
  resetApp: () => void;
}

export const useAppStore = create<AppState>(set => ({
  resetAllChats: false,
  forceInboxRefresh: false,
  pendingChatUpdate: undefined,

  setResetAllChats: (reset: boolean) => set(() => ({ resetAllChats: reset })),

  setForceInboxRefresh: (force: boolean) =>
    set(() => ({ forceInboxRefresh: force })),

  setPendingChatUpdate: (update: ChatUpdate | undefined) =>
    set(() => ({ pendingChatUpdate: update })),

  resetApp: () =>
    set(() => ({
      resetAllChats: true,
      forceInboxRefresh: false,
      pendingChatUpdate: undefined,
    })),
}));
