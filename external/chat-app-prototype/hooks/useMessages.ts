import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { Message } from '../types/message';
import { createMessage, createAppleMusicMessage } from '../utils/messageUtils';
import {
  createMessageAnimationValues,
  animateMessageSlideUp,
  animateDeliveredFadeIn,
  animateDeliveredFadeOut,
  ANIMATION_DELAYS,
} from '../utils/messageAnimations';
import { useChatStore } from '../stores';

export const useMessages = (chatId: string, initialMessages: Message[]) => {
  const store = useChatStore();
  const {
    setChatMessages,
    addMessage: addMessageToStore,
    updateMessage: updateMessageInStore,
    getMessages,
    chatMessages, // Get the reactive state directly
  } = store;

  const deliveredTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  // Initialize messages if not already in store - run immediately and reactively
  const currentMessages = chatMessages[chatId] || [];

  useEffect(() => {
    // Get current messages fresh from store inside the effect
    const currentMessagesInStore = getMessages(chatId);

    // Simple rule: if store is empty and we have initial messages, initialize
    const shouldInitialize =
      currentMessagesInStore.length === 0 && initialMessages.length > 0;

    if (shouldInitialize) {
      setChatMessages(chatId, initialMessages);
    }
  }, [chatId, getMessages, setChatMessages, initialMessages]);

  // Cleanup timeout when component unmounts
  useEffect(() => {
    return () => {
      if (deliveredTimeoutRef.current) {
        clearTimeout(deliveredTimeoutRef.current);
      }
    };
  }, []);

  const addMessage = (
    text: string,
    isSender: boolean = true,
    caption?: string
  ) => {
    const animationValues = createMessageAnimationValues();
    let newMessage: Message;

    // Check if this is an Apple Music message
    if (text.startsWith('applemusic:')) {
      const songId = text.replace('applemusic:', '');
      newMessage = {
        ...createAppleMusicMessage(
          {
            songId,
            songTitle: '',
            artistName: '',
            albumArtUrl: '',
          },
          isSender,
          caption
        ),
        ...animationValues,
      };
    } else {
      newMessage = {
        ...createMessage(text, isSender),
        ...animationValues,
      };
    }

    addMessageToStore(chatId, newMessage);

    // Animate message slide up for sender messages
    if (isSender && animationValues.animationValue) {
      animateMessageSlideUp(animationValues.animationValue).start();
    }

    return newMessage;
  };

  const addAppleMusicMessage = (
    songData: {
      songId: string;
      songTitle: string;
      artistName: string;
      albumArtUrl: string;
      duration?: number;
    },
    isSender: boolean = true
  ) => {
    const animationValues = createMessageAnimationValues();
    const newMessage: Message = {
      ...createAppleMusicMessage(songData, isSender),
      ...animationValues,
    };

    addMessageToStore(chatId, newMessage);

    // Animate message slide up for sender messages
    if (isSender && animationValues.animationValue) {
      animateMessageSlideUp(animationValues.animationValue).start();
    }

    return newMessage;
  };

  const showDeliveredIndicator = (
    messageId: string,
    onComplete?: () => void
  ) => {
    deliveredTimeoutRef.current = setTimeout(() => {
      const currentMessages = getMessages(chatId);
      const hasExistingDelivered = currentMessages.some(
        msg => msg.showDelivered
      );

      if (hasExistingDelivered) {
        // Find old delivered message and store its animation reference
        const oldDeliveredMessage = currentMessages.find(
          msg => msg.showDelivered && msg.id !== messageId
        );
        const oldDeliveredOpacity = oldDeliveredMessage?.deliveredOpacity;
        const oldDeliveredScale = oldDeliveredMessage?.deliveredScale;
        const oldMessageId = oldDeliveredMessage?.id;

        // Start old delivered fade-out first
        setTimeout(() => {
          if (oldDeliveredOpacity && oldDeliveredScale) {
            animateDeliveredFadeOut(
              oldDeliveredOpacity,
              oldDeliveredScale
            ).start(() => {
              // Remove old delivered after animation completes
              if (oldMessageId) {
                updateMessageInStore(chatId, oldMessageId, {
                  showDelivered: false,
                });

                // Add new delivered and animate in immediately after old is removed
                const newDeliveredOpacity = new Animated.Value(0);
                const newDeliveredScale = new Animated.Value(0.7);

                updateMessageInStore(chatId, messageId, {
                  showDelivered: true,
                  deliveredOpacity: newDeliveredOpacity,
                  deliveredScale: newDeliveredScale,
                });

                // Animate in the new delivered indicator immediately
                animateDeliveredFadeIn(
                  newDeliveredOpacity,
                  newDeliveredScale
                ).start(() => {
                  onComplete?.();
                });
              }
            });
          }
        }, 200);
      } else {
        // No existing delivered message, use same animation approach
        const newDeliveredOpacity = new Animated.Value(0);
        const newDeliveredScale = new Animated.Value(0.7);

        // Add the new delivered indicator
        updateMessageInStore(chatId, messageId, {
          showDelivered: true,
          deliveredOpacity: newDeliveredOpacity,
          deliveredScale: newDeliveredScale,
        });

        // Animate in the new delivered indicator
        setTimeout(() => {
          animateDeliveredFadeIn(newDeliveredOpacity, newDeliveredScale).start(
            () => onComplete?.()
          );
        }, 200);
      }
    }, ANIMATION_DELAYS.DELIVERED_SHOW);
  };

  return {
    messages: currentMessages,
    setMessages: (messages: Message[]) => setChatMessages(chatId, messages),
    addMessage,
    addAppleMusicMessage,
    showDeliveredIndicator,
  };
};
