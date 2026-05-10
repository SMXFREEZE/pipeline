import React, { useRef, useEffect } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import TypingIndicator from './TypingIndicator';
import { Message } from '../../types/message';
import { Spacing } from '../../constants/theme';

interface TypingSectionProps {
  showTypingIndicator: boolean;
  typingIndicatorOpacity: Animated.Value;
  messages: Message[];
}

const TypingSection: React.FC<TypingSectionProps> = ({
  showTypingIndicator,
  typingIndicatorOpacity,
  messages,
}) => {
  const slideTransform = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (showTypingIndicator) {
      // Slide in from below
      slideTransform.setValue(20);
      Animated.timing(slideTransform, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // Slide down when disappearing
      Animated.timing(slideTransform, {
        toValue: 20,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showTypingIndicator, slideTransform]);

  if (!showTypingIndicator) return null;

  return (
    <>
      {messages.length > 0 && messages[messages.length - 1].isSender && (
        <View style={styles.groupSpacing} />
      )}
      <Animated.View
        style={[
          styles.typingContainer,
          {
            opacity: typingIndicatorOpacity,
            transform: [{ translateY: slideTransform }],
          },
        ]}
      >
        <TypingIndicator
          isVisible={showTypingIndicator}
          hasSmallGap={
            messages.length > 0 && !messages[messages.length - 1].isSender
          }
        />
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  groupSpacing: {
    height: Spacing.groupSpacing,
  },
  typingContainer: {
    marginBottom: 0, // Space above input field
  },
});

export default TypingSection;
