import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { Colors, Spacing } from '../constants/theme';
import aiService from '../services/ai';
import ChatListItem from '../components/inbox/ChatListItem';
import { ChatItem, mockChats } from '../data/inbox';
import { useChatUpdates } from '../contexts/ChatUpdateContext';
import { resetEmitter } from '../utils/resetEmitter';
import { useAppStore, useChatStore } from '../stores';

type InboxScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Inbox'
>;

interface InboxScreenProps {
  navigation: InboxScreenNavigationProp;
}

const InboxScreen: React.FC<InboxScreenProps> = ({ navigation }) => {
  const [chats, setChats] = useState<ChatItem[]>(mockChats);
  const {
    pendingChatUpdate,
    forceInboxRefresh,
    setResetAllChats,
    setPendingChatUpdate,
    setForceInboxRefresh,
  } = useAppStore();
  const { clearAllChats } = useChatStore();
  const { chatUpdates, resetAllUpdates } = useChatUpdates();
  const isResetting = useRef(false);
  const [forceOriginalData, setForceOriginalData] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const flatListRef = useRef<FlatList>(null);

  // Listen for reset events from the header button
  useEffect(() => {
    const handleReset = () => {
      isResetting.current = true;

      // Force original data mode
      setForceOriginalData(true);

      // Force complete reset with fresh mock data
      const freshMockChats = JSON.parse(JSON.stringify(mockChats));
      setChats(freshMockChats);

      // Force complete re-render with new key
      setResetKey(prev => prev + 1);

      setResetAllChats(false);
      clearAllChats();
      aiService.resetMentionedSongs();

      // Reset all context updates completely
      resetAllUpdates();

      // Keep resetting flags true for longer to prevent any context interference
      setTimeout(() => {
        isResetting.current = false;
        setForceOriginalData(false);
      }, 2000);
    };

    const subscription = resetEmitter.addListener(handleReset);

    return () => subscription.remove();
  }, [resetAllUpdates, forceOriginalData, clearAllChats, setResetAllChats]);

  // Immediately apply context updates whenever chatUpdates changes
  useEffect(() => {
    if (isResetting.current || forceOriginalData) return; // Skip updates during reset or when forcing original data

    if (Object.keys(chatUpdates).length > 0) {
      setChats(prevChats => {
        let hasChanges = false;
        const updatedChats = prevChats.map(chat => {
          const contextUpdate = chatUpdates[chat.id];
          if (
            contextUpdate &&
            (chat.lastMessage !== contextUpdate.lastMessage ||
              chat.timestamp !== contextUpdate.timestamp)
          ) {
            hasChanges = true;
            return {
              ...chat,
              lastMessage: contextUpdate.lastMessage,
              timestamp: contextUpdate.timestamp,
              unread: contextUpdate.unread,
            };
          }
          return chat;
        });
        return hasChanges ? updatedChats : prevChats;
      });
    }
  }, [chatUpdates, forceOriginalData]);

  // Handle pending chat updates from app store
  const handlePendingUpdates = React.useCallback(() => {
    if (pendingChatUpdate) {
      console.log('Applying update to chat:', pendingChatUpdate.id);
      setChats(prevChats =>
        prevChats.map(chat =>
          chat.id === pendingChatUpdate.id
            ? { ...chat, ...pendingChatUpdate }
            : chat
        )
      );
      setPendingChatUpdate(undefined);
    }

    // Check for force refresh flag
    if (forceInboxRefresh) {
      setForceInboxRefresh(false);
      setChats(prevChats => [...prevChats]);
    }
  }, [
    pendingChatUpdate,
    forceInboxRefresh,
    setPendingChatUpdate,
    setForceInboxRefresh,
  ]);

  // Remove unused focus tracking that was causing re-renders

  // Disabled polling since we now use context for immediate updates
  // useEffect(() => {
  //   if (!isFocused) return;
  //   const interval = setInterval(checkForUpdates, 500);
  //   return () => clearInterval(interval);
  // }, [checkForUpdates, isFocused]);

  // Handle cleanup when returning from chat screen
  useFocusEffect(
    React.useCallback(() => {
      // Handle any pending updates from app store
      handlePendingUpdates();
    }, [handlePendingUpdates])
  );
  const renderChatItem = ({ item }: { item: ChatItem }) => (
    <ChatListItem
      item={item}
      onPress={() => {
        navigation.navigate('Chat', {
          contactName: item.name,
          contactAvatar: item.avatar?.toString(),
          chatId: item.id,
          isGroup: item.isGroup,
          groupAvatars: item.groupAvatars,
        });

        // Delay marking as read until after transition completes
        setTimeout(() => {
          setChats(prevChats =>
            prevChats.map(chat =>
              chat.id === item.id ? { ...chat, unread: false } : chat
            )
          );
        }, 350); // Match the navigation animation duration
      }}
    />
  );

  return (
    <FlatList
      key={resetKey} // Force complete re-render on reset
      ref={flatListRef}
      data={chats}
      renderItem={renderChatItem}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.listContainer}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      style={styles.listStyle}
      contentInsetAdjustmentBehavior='automatic'
      automaticallyAdjustContentInsets={true}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    backgroundColor: Colors.chatItemBackground,
  },
  listStyle: {
    backgroundColor: Colors.white,
    flex: 1,
  },
  separator: {
    backgroundColor: Colors.dividerGray,
    height: StyleSheet.hairlineWidth,
    marginLeft: Spacing.separatorMarginLeft,
  },
});

export default InboxScreen;
