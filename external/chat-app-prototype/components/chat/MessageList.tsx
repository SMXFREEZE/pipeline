import React, { useMemo } from 'react';
import { Animated, StyleSheet, View, FlatList } from 'react-native';
import BubbleRenderer from '../bubbles/BubbleRenderer';
import ChatBanner from './ChatBanner';
import { Message } from '../../types/message';
import {
  shouldShowTimestamp,
  shouldAddGroupSpacing,
  isLastInGroup,
  isFirstInGroup,
} from '../../utils/messageUtils';
import {
  getMessageSlideTransform,
  getDeliveredScaleTransform,
} from '../../utils/messageAnimations';
import { Colors, Typography, Spacing } from '../../constants/theme';

// Types for flattened data structure
type MessageItem = {
  type: 'message';
  message: Message;
  messageIndex: number;
};

type TimestampItem = {
  type: 'timestamp';
  timestamp: string;
  id: string;
};

type SpacingItem = {
  type: 'spacing';
  id: string;
};

type DeliveredItem = {
  type: 'delivered';
  message: Message;
  messageIndex: number;
  id: string;
};

type FlatListItem = MessageItem | TimestampItem | SpacingItem | DeliveredItem;

interface MessageListProps {
  messages: Message[];
  deliveredOpacity: Animated.Value;
  deliveredScale: Animated.Value;
  style?: any;
  contentContainerStyle?: any;
  onLayout?: () => void;
  onContentSizeChange?: () => void;
  scrollViewRef?: React.RefObject<FlatList | null>;
  ListFooterComponent?: React.ComponentType<any> | React.ReactElement | null;
  disableKeyboardHandling?: boolean;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  deliveredOpacity,
  deliveredScale,
  style,
  contentContainerStyle,
  onLayout,
  onContentSizeChange,
  scrollViewRef,
  ListFooterComponent,
}) => {
  // Create flattened data structure for FlatList
  const flatListData = useMemo((): FlatListItem[] => {
    const items: FlatListItem[] = [];

    if (!messages || !Array.isArray(messages)) {
      return items;
    }

    messages.forEach((message, index) => {
      // Add timestamp header if needed
      if (shouldShowTimestamp(messages, index)) {
        items.push({
          type: 'timestamp',
          timestamp: message.timestamp,
          id: `timestamp-${message.id}`,
        });
      }

      // Add group spacing if needed
      if (shouldAddGroupSpacing(messages, index)) {
        items.push({
          type: 'spacing',
          id: `spacing-${message.id}`,
        });
      }

      // Add the message
      items.push({
        type: 'message',
        message,
        messageIndex: index,
      });

      // Add delivered indicator if needed
      // Allow delivered to show even if not last in group during transition
      if (message.isSender && message.showDelivered) {
        items.push({
          type: 'delivered',
          message,
          messageIndex: index,
          id: `delivered-${message.id}`,
        });
      }
    });

    return items;
  }, [messages]);

  const renderItem = ({ item }: { item: FlatListItem }) => {
    switch (item.type) {
      case 'timestamp':
        return <ChatBanner type='timestamp' content={item.timestamp} />;

      case 'spacing':
        return <View style={styles.groupSpacing} />;

      case 'message': {
        const { message, messageIndex } = item;
        const messageAlignSelf = message.isSender ? 'flex-end' : 'flex-start';

        return (
          <Animated.View
            style={{
              transform: getMessageSlideTransform(
                message.animationValue,
                message.isSender
              ),
              alignSelf: messageAlignSelf,
            }}
          >
            <BubbleRenderer
              message={message}
              isLastInGroup={isLastInGroup(messages, messageIndex)}
              isFirstInGroup={isFirstInGroup(messages, messageIndex)}
              hasReaction={
                !!message.hasReaction && isFirstInGroup(messages, messageIndex)
              }
            />
          </Animated.View>
        );
      }

      case 'delivered': {
        const { message, messageIndex } = item;
        const isLastInGroupDelivered = isLastInGroup(messages, messageIndex);
        return (
          <Animated.View
            style={[
              styles.deliveredContainer,
              !isLastInGroupDelivered && styles.deliveredNotLastInGroup,
              {
                opacity: message.deliveredOpacity || deliveredOpacity,
              },
            ]}
          >
            <Animated.Text
              style={[
                styles.deliveredText,
                {
                  transform: getDeliveredScaleTransform(
                    message.deliveredScale,
                    deliveredScale
                  ),
                },
              ]}
            >
              Delivered
            </Animated.Text>
          </Animated.View>
        );
      }

      default:
        return null;
    }
  };

  const keyExtractor = (item: FlatListItem) => {
    switch (item.type) {
      case 'message':
        return item.message.id;
      default:
        return item.id;
    }
  };

  return (
    <FlatList
      ref={scrollViewRef}
      data={flatListData}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      style={style}
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={false}
      onLayout={onLayout}
      onContentSizeChange={onContentSizeChange}
      removeClippedSubviews={false}
      maxToRenderPerBatch={50}
      windowSize={20}
      initialNumToRender={50}
      keyboardShouldPersistTaps='handled'
      keyboardDismissMode='interactive'
      automaticallyAdjustKeyboardInsets={true}
      automaticallyAdjustContentInsets={false}
      maintainVisibleContentPosition={{
        minIndexForVisible: 0,
        autoscrollToTopThreshold: 10,
      }}
      ListFooterComponent={ListFooterComponent}
    />
  );
};

const styles = StyleSheet.create({
  deliveredContainer: {
    alignItems: 'flex-end',
    marginLeft: '25%',
    marginRight: 0,
    marginTop: 2,
  },
  deliveredNotLastInGroup: {
    marginBottom: 4,
  },
  deliveredText: {
    color: Colors.textSecondary,
    fontFamily: Typography.fontFamily,
    fontSize: Typography.delivered,
    fontWeight: Typography.medium,
    paddingRight: 4,
  },
  groupSpacing: {
    height: Spacing.groupSpacing,
  },
});

export default MessageList;
