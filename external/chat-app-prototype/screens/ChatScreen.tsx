import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Keyboard, Animated, FlatList } from 'react-native';
import { default as ReanimatedAnimated } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import InputBar from '../components/chat/InputBar';
import NavigationBar from '../components/navigation/NavigationBar';
import MessageList from '../components/chat/MessageList';
import TypingSection from '../components/chat/TypingSection';
import { allConversations } from '../data/messages';
import { Colors, Spacing } from '../constants/theme';
import { RootStackParamList } from '../types/navigation';
import { useKeyboard } from '../hooks/useKeyboard';
import { useMessages } from '../hooks/useMessages';
import { useAIResponse } from '../hooks/useAIResponse';
import { getChatSlideTransform } from '../utils/messageAnimations';
import { useChatUpdates } from '../contexts/ChatUpdateContext';

import { useAppStore, useChatStore } from '../stores';

type ChatScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Chat'
>;

type ChatScreenRouteProp = RouteProp<RootStackParamList, 'Chat'>;

interface ChatScreenProps {
  navigation: ChatScreenNavigationProp;
  route: ChatScreenRouteProp;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ navigation, route }) => {
  const { contactName, chatId, contactAvatar, isGroup, groupAvatars } =
    route.params;

  // Hooks
  const { keyboardVisible, keyboardAnimatedStyle } = useKeyboard();
  const { updateChat } = useChatUpdates();
  const { setPendingChatUpdate } = useAppStore();

  // Find initial messages
  const initialMessages = (() => {
    const conversation = allConversations.find(
      conv =>
        conv.name === contactName || conv.id.toString() === chatId.toString()
    );
    return conversation ? conversation.messages : [];
  })();

  const { messages, addMessage, showDeliveredIndicator } = useMessages(
    chatId,
    initialMessages
  );

  // State
  const [aiEnabled] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // Refs
  const scrollViewRef = useRef<FlatList>(null);
  const deliveredOpacity = useRef(new Animated.Value(0)).current;
  const deliveredScale = useRef(new Animated.Value(0.7)).current;
  const lastSentMessageRef = useRef<{
    text: string;
    timestamp: string;
    isUserMessage: boolean;
  } | null>(null);

  // AI Response handling
  const {
    showTypingIndicator,
    typingIndicatorOpacity,
    chatSlideDown,
    generateAIResponse,
  } = useAIResponse({
    messages,
    contactName,
    aiEnabled,
    onAddMessage: message => {
      const { addMessage: addToStore } = useChatStore.getState();
      addToStore(chatId, message);
    },
    onUpdateLastSentMessage: (text, timestamp, isUserMessage) => {
      lastSentMessageRef.current = { text, timestamp, isUserMessage };
      // Update context for AI responses too
      if (!isUserMessage) {
        updateChat(chatId, {
          id: chatId,
          lastMessage: text,
          timestamp: timestamp,
          unread: false,
        });
      }
    },
    scrollToEnd: () => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollToOffset({
          offset: 999999,
          animated: true,
        });
      }
    },
  });

  // Immediately scroll to bottom when component mounts (inverted list uses offset 0)
  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToOffset({
        offset: 999999,
        animated: false,
      });
    }
  }, []);

  // Set delivered indicator on last sender message when chat loads
  const { updateMessage: updateMessageInStore } = useChatStore();
  const hasSetInitialDelivered = useRef(false);
  useEffect(() => {
    if (hasSetInitialDelivered.current || !messages || !Array.isArray(messages))
      return;

    // Find the last sender message
    const lastSenderMessage = messages
      .slice() // Create a copy to avoid mutating
      .reverse()
      .find(msg => msg.isSender);

    if (lastSenderMessage) {
      // Create individual animation values for initial delivered indicator
      const initialDeliveredOpacity = new Animated.Value(1);
      const initialDeliveredScale = new Animated.Value(1);

      // Remove delivered status from all messages first
      messages.forEach(msg => {
        if (msg.showDelivered) {
          updateMessageInStore(chatId, msg.id, { showDelivered: false });
        }
      });

      // Add delivered status to the last sender message
      updateMessageInStore(chatId, lastSenderMessage.id, {
        showDelivered: true,
        deliveredOpacity: initialDeliveredOpacity,
        deliveredScale: initialDeliveredScale,
      });

      // Set initial values for immediate visibility (no animation needed for existing delivered)
      initialDeliveredOpacity.setValue(1);
      initialDeliveredScale.setValue(1);
      hasSetInitialDelivered.current = true;
    }
  }, [messages, chatId, updateMessageInStore]); // React to messages changes

  // Auto-scroll for new messages with smooth animation
  const previousLength = useRef(messages.length);
  useEffect(() => {
    if (messages.length > previousLength.current) {
      // Only scroll if messages increased (new message added)
      setTimeout(() => {
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollToOffset({
            offset: 999999,
            animated: true,
          });
        }
      }, 100);
    }
    previousLength.current = messages.length;
  }, [messages.length]);

  // Auto-scroll when typing indicator appears
  useEffect(() => {
    if (showTypingIndicator) {
      setTimeout(() => {
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollToOffset({
            offset: 999999,
            animated: true,
          });
        }
      }, 100);
    }
  }, [showTypingIndicator]);

  // Scroll to bottom immediately when keyboard appears — messages jump up first,
  // then the keyboard/input bar animate up to meet them (matching native iMessage)
  useEffect(() => {
    if (keyboardVisible) {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollToOffset({
          offset: 999999,
          animated: false,
        });
      }
    }
  }, [keyboardVisible]);

  // Navigation handling
  useEffect(() => {
    // Scroll to bottom when screen starts focusing (before transition becomes visible)
    const unsubscribeFocus = navigation.addListener('focus', () => {
      // Set flag to scroll when content size changes (ensuring content is fully laid out)
      setShouldScrollOnContentChange(true);
    });

    const unsubscribeBeforeRemove = navigation.addListener(
      'beforeRemove',
      () => {
        if (lastSentMessageRef.current) {
          setPendingChatUpdate({
            id: chatId,
            lastMessage: lastSentMessageRef.current.isUserMessage
              ? `You: ${lastSentMessageRef.current.text}`
              : lastSentMessageRef.current.text,
            timestamp: lastSentMessageRef.current.timestamp,
            unread: false,
          });
          lastSentMessageRef.current = null;
        }
      }
    );

    // Also listen for transition start to handle swipe back earlier
    const unsubscribeTransitionStart = navigation.addListener(
      'transitionStart',
      e => {
        // Only update on backwards transition (going back to inbox)
        if (e.data?.closing && lastSentMessageRef.current) {
          setPendingChatUpdate({
            id: chatId,
            lastMessage: lastSentMessageRef.current.isUserMessage
              ? `You: ${lastSentMessageRef.current.text}`
              : lastSentMessageRef.current.text,
            timestamp: lastSentMessageRef.current.timestamp,
            unread: false,
          });
          lastSentMessageRef.current = null;
        }
      }
    );

    return () => {
      unsubscribeFocus();
      unsubscribeBeforeRemove();
      unsubscribeTransitionStart();
    };
  }, [navigation, chatId, setPendingChatUpdate]);

  // Handlers
  const handleScrollViewLayout = () => {
    // Ensure scroll to bottom on layout (no delay needed since initial scroll is handled in useEffect)
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToOffset({
        offset: 999999,
        animated: false,
      });
    }
  };

  const [shouldScrollOnContentChange, setShouldScrollOnContentChange] =
    useState(false);

  const handleContentSizeChange = () => {
    // Only scroll if we're expecting it (after focus event)
    if (shouldScrollOnContentChange && scrollViewRef.current) {
      scrollViewRef.current.scrollToOffset({
        offset: 999999,
        animated: false,
      });
      setShouldScrollOnContentChange(false);
    }
  };

  const handleSendMessage = (text: string, appleMusicUrl?: string) => {
    if (isSending || (!text.trim() && !appleMusicUrl)) return;

    setIsSending(true);

    const currentTime = new Date().toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });

    // Determine message text and type
    let messageText = text;
    let caption: string | undefined;

    if (appleMusicUrl) {
      // Extract song ID from URL for the bubble
      const match = appleMusicUrl.match(/\/(\d+)(\?i=(\d+))?/);
      const songId = match ? match[3] || match[1] : '';

      // Preserve any user-typed text as a caption above the music card
      caption = text.trim() || undefined;

      // Create a special message format for Apple Music
      messageText = `applemusic:${songId}`;
    }

    // Add message with animations
    const newMessage = addMessage(messageText, true, caption);

    // Preview text for inbox / AI context — include caption when present
    const sharedSongPreview = caption
      ? `${caption} • Shared a song`
      : 'Shared a song';

    // Store for inbox update
    lastSentMessageRef.current = {
      text: appleMusicUrl ? sharedSongPreview : text,
      timestamp: currentTime,
      isUserMessage: true,
    };

    // Update chat preview immediately via context
    updateChat(chatId, {
      id: chatId,
      lastMessage: appleMusicUrl ? `You: ${sharedSongPreview}` : `You: ${text}`,
      timestamp: currentTime,
      unread: false,
    });

    // Show delivered indicator
    showDeliveredIndicator(newMessage.id, () => {
      if (aiEnabled) {
        generateAIResponse(appleMusicUrl ? sharedSongPreview : text);
      }
      setIsSending(false);
    });
  };

  return (
    <View style={styles.fullContainer}>
      <SafeAreaView style={styles.container}>
        <Animated.View
          style={[
            styles.messagesContainer,
            {
              transform: getChatSlideTransform(chatSlideDown),
            },
          ]}
        >
          <MessageList
            messages={messages}
            deliveredOpacity={deliveredOpacity}
            deliveredScale={deliveredScale}
            scrollViewRef={scrollViewRef}
            style={styles.messagesList}
            contentContainerStyle={[
              styles.messagesContent,
              keyboardVisible && styles.messagesContentKeyboardVisible,
            ]}
            onLayout={handleScrollViewLayout}
            onContentSizeChange={handleContentSizeChange}
            ListFooterComponent={
              <TypingSection
                showTypingIndicator={showTypingIndicator}
                typingIndicatorOpacity={typingIndicatorOpacity}
                messages={messages}
              />
            }
          />
        </Animated.View>
      </SafeAreaView>

      <ReanimatedAnimated.View
        style={[styles.inputBarContainer, keyboardAnimatedStyle]}
      >
        <InputBar
          onSendMessage={handleSendMessage}
          keyboardVisible={keyboardVisible}
          disabled={isSending}
        />
      </ReanimatedAnimated.View>

      <View style={styles.navigationBarContainer}>
        <NavigationBar
          contactName={contactName}
          contactAvatar={contactAvatar ? parseInt(contactAvatar) : undefined}
          isGroup={isGroup}
          groupAvatars={groupAvatars}
          onBackPress={() => {
            Keyboard.dismiss();
            navigation.goBack();
          }}
          onContactPress={() => {}}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.screenBackground,
    flex: 1,
  },
  fullContainer: {
    backgroundColor: Colors.screenBackground,
    flex: 1,
  },
  inputBarContainer: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  messagesContainer: {
    backgroundColor: Colors.screenBackground,
    flex: 1,
  },
  messagesContent: {
    paddingBottom: 48, // Account for input bar height
    paddingLeft: Spacing.containerPadding,
    paddingRight: Spacing.inputPadding,
    paddingTop: 40,
  },
  messagesContentKeyboardVisible: {
    paddingBottom: 60,
  },
  messagesList: {
    backgroundColor: Colors.screenBackground,
    flex: 1,
  },
  navigationBarContainer: {
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 1,
  },
});

export default ChatScreen;
