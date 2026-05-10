import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import BubbleTail from './shared/BubbleTail';
import Reaction from '../chat/Reaction';
import { Colors, Typography, Spacing, Layout } from '../../constants/theme';
import { ReactionType } from '../../utils/reactions';

interface MessageBubbleProps {
  text: string;
  isSender: boolean;
  hasReaction?: boolean;
  reactionType?: ReactionType;
  isLastInGroup?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  text,
  isSender,
  hasReaction = false,
  reactionType,
  isLastInGroup = false,
}) => {
  return (
    <View
      style={[
        styles.container,
        isSender ? styles.senderContainer : styles.recipientContainer,
        hasReaction && styles.containerWithReaction,
      ]}
    >
      <View
        style={[
          styles.bubble,
          isSender ? styles.senderBubble : styles.recipientBubble,
        ]}
      >
        <Text
          style={[
            styles.text,
            isSender ? styles.senderText : styles.recipientText,
          ]}
        >
          {text}
        </Text>
      </View>
      {hasReaction && reactionType && (
        <Reaction reactionType={reactionType} isSender={isSender} />
      )}
      {isLastInGroup && (
        <View style={isSender ? styles.senderTail : styles.recipientTail}>
          <BubbleTail
            color={isSender ? Colors.systemBlue : Colors.messageBubbleGray}
            size={16}
            flipped={!isSender}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  bubble: {
    borderRadius: Spacing.messageBorderRadius,
    paddingHorizontal: Spacing.messagePadding,
    paddingVertical: Spacing.messagePaddingVertical,
  },
  container: {
    marginVertical: 0.5,
    maxWidth: Layout.maxMessageWidth,
    position: 'relative',
  },
  containerWithReaction: {
    paddingTop: 20,
  },
  recipientBubble: {
    backgroundColor: Colors.messageBubbleGray,
  },
  recipientContainer: {
    alignSelf: 'flex-start',
    marginRight: Layout.messageMarginSide,
  },
  recipientTail: {
    bottom: 0.5,
    left: -5.5,
    position: 'absolute',
    zIndex: 10,
  },
  recipientText: {
    color: Colors.black,
  },
  senderBubble: {
    backgroundColor: Colors.messageBubbleBlue,
  },
  senderContainer: {
    alignSelf: 'flex-end',
    marginLeft: Layout.messageMarginSide,
  },
  senderTail: {
    bottom: 0.5,
    position: 'absolute',
    right: -5.5,
    zIndex: 10,
  },
  senderText: {
    color: Colors.white,
    opacity: 0.9,
  },
  text: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.message,
    fontWeight: Typography.regular,
    letterSpacing: -0.15,
    lineHeight: Typography.messageLineHeight,
  },
});

export default MessageBubble;
