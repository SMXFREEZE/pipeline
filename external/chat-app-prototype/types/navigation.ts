export type RootStackParamList = {
  Inbox:
    | {
        updatedChat?: {
          id: string;
          lastMessage?: string;
          timestamp?: string;
          unread?: boolean;
        };
      }
    | undefined;
  Chat: {
    contactName: string;
    contactAvatar?: string;
    chatId: string;
    isGroup?: boolean;
    groupAvatars?: number[];
  };
};
