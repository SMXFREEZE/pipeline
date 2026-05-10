import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Colors } from '../../constants/theme';

interface TypingIndicatorProps {
  isVisible?: boolean;
  hasSmallGap?: boolean;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  isVisible = true,
  hasSmallGap = false,
}) => {
  const dot1Opacity = useRef(new Animated.Value(0.5)).current;
  const dot2Opacity = useRef(new Animated.Value(0.5)).current;
  const dot3Opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (!isVisible) {
      // Reset all dots to base opacity when not visible
      dot1Opacity.setValue(0.5);
      dot2Opacity.setValue(0.5);
      dot3Opacity.setValue(0.5);
      return;
    }

    const createDotAnimation = (dotOpacity: Animated.Value, delay: number) => {
      return Animated.sequence([
        Animated.delay(delay),
        Animated.timing(dotOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(dotOpacity, {
          toValue: 0.5,
          duration: 600,
          useNativeDriver: true,
        }),
      ]);
    };

    const animationLoop = () => {
      return Animated.parallel([
        createDotAnimation(dot1Opacity, 0),
        createDotAnimation(dot2Opacity, 200),
        createDotAnimation(dot3Opacity, 400),
      ]);
    };

    const startAnimation = () => {
      animationLoop().start(() => {
        if (isVisible) {
          startAnimation();
        }
      });
    };

    startAnimation();

    return () => {
      dot1Opacity.stopAnimation();
      dot2Opacity.stopAnimation();
      dot3Opacity.stopAnimation();
    };
  }, [isVisible, dot1Opacity, dot2Opacity, dot3Opacity]);

  if (!isVisible) return null;

  return (
    <View style={[styles.container, hasSmallGap && styles.smallGapContainer]}>
      <View style={styles.bubbleContainer}>
        <View style={styles.bubble}>
          <View style={styles.dotGroup}>
            <Animated.View style={[styles.dot, { opacity: dot1Opacity }]} />
            <Animated.View style={[styles.dot, { opacity: dot2Opacity }]} />
            <Animated.View style={[styles.dot, { opacity: dot3Opacity }]} />
          </View>
        </View>
        <View style={styles.tailDot1} />
        <View style={styles.tailDot2} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bubble: {
    backgroundColor: Colors.messageBubbleGray,
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  bubbleContainer: {
    position: 'relative',
  },
  container: {
    alignSelf: 'flex-start',
    marginBottom: 0,
    marginRight: '25%',
    marginTop: 1,
  },
  dot: {
    backgroundColor: Colors.textTertiary,
    borderRadius: 3.5,
    height: 7,
    width: 7,
  },
  dotGroup: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'center',
  },
  smallGapContainer: {
    marginTop: 1,
  },
  tailDot1: {
    backgroundColor: Colors.messageBubbleGray,
    borderRadius: 5,
    bottom: 0,
    height: 10,
    left: -1,
    position: 'absolute',
    width: 10,
  },
  tailDot2: {
    backgroundColor: Colors.messageBubbleGray,
    borderRadius: 2.5,
    bottom: -3.5,
    height: 5,
    left: -4.5,
    position: 'absolute',
    width: 5,
  },
});

export default TypingIndicator;
