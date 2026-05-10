import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '../../constants/theme';
import { ReactionType, getReactionEmoji } from '../../utils/reactions';

interface ReactionProps {
  reactionType: ReactionType;
  isSender: boolean;
  position?: 'left' | 'right';
}

const Reaction: React.FC<ReactionProps> = ({
  reactionType,
  isSender,
  position,
}) => {
  // Auto-determine position based on isSender if not explicitly provided
  const bubblePosition = position || (isSender ? 'left' : 'right');

  return (
    <View
      style={[
        styles.reactionContainer,
        bubblePosition === 'left' ? styles.leftReaction : styles.rightReaction,
      ]}
    >
      <View
        style={[
          styles.reactionBubble,
          isSender
            ? styles.senderReactionBubble
            : styles.recipientReactionBubble,
        ]}
      >
        <Text style={styles.reactionText}>
          {getReactionEmoji(reactionType)}
        </Text>
      </View>
      <View
        style={[
          styles.reactionTail,
          isSender ? styles.senderReactionTail : styles.recipientReactionTail,
        ]}
      >
        <View
          style={[
            styles.tailDot,
            styles.tailDotLarge,
            isSender ? styles.senderTailDotLarge : styles.recipientTailDotLarge,
            {
              backgroundColor: isSender
                ? Colors.messageBubbleGray
                : Colors.messageBubbleBlue,
            },
          ]}
        />
        <View
          style={[
            styles.tailDot,
            styles.tailDotSmall,
            isSender ? styles.senderTailDotSmall : styles.recipientTailDotSmall,
            {
              backgroundColor: isSender
                ? Colors.messageBubbleGray
                : Colors.messageBubbleBlue,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  leftReaction: {
    left: -16,
  },
  reactionBubble: {
    alignItems: 'center',
    borderColor: Colors.reactionBorder,
    borderRadius: Spacing.reactionBorderRadius,
    borderWidth: 1,
    height: Spacing.reactionSize,
    justifyContent: 'center',
    width: Spacing.reactionSize,
  },
  reactionContainer: {
    height: Spacing.reactionContainerHeight,
    position: 'absolute',
    top: -4,
    width: Spacing.reactionContainerWidth,
  },
  reactionTail: {
    height: Spacing.reactionTailSize,
    position: 'absolute',
    width: Spacing.reactionTailSize,
  },
  reactionText: {
    fontSize: Typography.reactionEmoji,
  },
  recipientReactionBubble: {
    backgroundColor: Colors.messageBubbleBlue,
  },
  recipientReactionTail: {
    bottom: -15,
    right: -5,
  },
  recipientTailDotLarge: {
    left: 13,
    top: -1,
  },
  recipientTailDotSmall: {
    left: 23,
    top: 8,
  },
  rightReaction: {
    right: -16,
  },
  senderReactionBubble: {
    backgroundColor: Colors.messageBubbleGray,
  },
  senderReactionTail: {
    bottom: -15,
    left: -5,
  },
  senderTailDotLarge: {
    right: 13,
    top: -1,
  },
  senderTailDotSmall: {
    right: 23,
    top: 8,
  },
  tailDot: {
    borderRadius: Spacing.tailDotBorderRadius,
    position: 'absolute',
  },
  tailDotLarge: {
    height: Spacing.tailDotLargeSize,
    width: Spacing.tailDotLargeSize,
  },
  tailDotSmall: {
    height: Spacing.tailDotSmallSize,
    width: Spacing.tailDotSmallSize,
  },
});

export default Reaction;
