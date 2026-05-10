import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ChatUpdate {
  id: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
}

interface ChatUpdateContextType {
  chatUpdates: { [chatId: string]: ChatUpdate };
  updateChat: (chatId: string, update: ChatUpdate) => void;
  clearUpdate: (chatId: string) => void;
  resetAllUpdates: () => void;
}

const ChatUpdateContext = createContext<ChatUpdateContextType | undefined>(
  undefined
);

export const useChatUpdates = () => {
  const context = useContext(ChatUpdateContext);
  if (!context) {
    throw new Error('useChatUpdates must be used within a ChatUpdateProvider');
  }
  return context;
};

interface ChatUpdateProviderProps {
  children: ReactNode;
}

export const ChatUpdateProvider: React.FC<ChatUpdateProviderProps> = ({
  children,
}) => {
  const [chatUpdates, setChatUpdates] = useState<{
    [chatId: string]: ChatUpdate;
  }>({});

  const updateChat = (chatId: string, update: ChatUpdate) => {
    setChatUpdates(prev => ({
      ...prev,
      [chatId]: update,
    }));
  };

  const clearUpdate = (chatId: string) => {
    setChatUpdates(prev => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [chatId]: _, ...rest } = prev;
      return rest;
    });
  };

  const resetAllUpdates = () => {
    setChatUpdates({});
  };

  return (
    <ChatUpdateContext.Provider
      value={{ chatUpdates, updateChat, clearUpdate, resetAllUpdates }}
    >
      {children}
    </ChatUpdateContext.Provider>
  );
};
