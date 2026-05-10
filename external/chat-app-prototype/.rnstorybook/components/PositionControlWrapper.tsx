import React, { useState, useRef, useCallback } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
  View,
} from 'react-native';
import { Path, Svg } from 'react-native-svg';
import { useTheme } from '@storybook/react-native-theming';

interface PositionControlWrapperProps {
  children: React.ReactNode;
}

const ANIMATION_DURATION = 250;
const { height: screenHeight } = Dimensions.get('window');
// Fixed position from top of screen (below header)
const HEADER_HEIGHT = 100; // Approximate header height including status bar
const TOP_POSITION = HEADER_HEIGHT + 20; // 20px padding below header

// Icon for push to top (arrow up)
const ArrowUpIcon = ({ color = '#73828C' }) => (
  <Svg width={14} height={14} viewBox='0 0 14 14' fill='none'>
    <Path
      d='M7 2.5l-4 4a.5.5 0 00.708.707L6.5 4.414V11.5a.5.5 0 001 0V4.414l2.793 2.793a.5.5 0 10.707-.707l-4-4z'
      fill={color}
    />
  </Svg>
);

// Icon for recenter (arrow down)
const ArrowDownIcon = ({ color = '#73828C' }) => (
  <Svg width={14} height={14} viewBox='0 0 14 14' fill='none'>
    <Path
      d='M7 11.5l4-4a.5.5 0 00-.708-.707L7.5 9.586V2.5a.5.5 0 00-1 0v7.086L3.707 6.793a.5.5 0 10-.707.707l4 4z'
      fill={color}
    />
  </Svg>
);

// Store position state globally to persist across re-renders
let globalIsAtTop = false;

// Separate component for the floating button
const FloatingButton: React.FC<{
  isAtTop: boolean;
  onPress: () => void;
}> = ({ isAtTop, onPress }) => {
  const theme = useTheme();

  return (
    <View style={styles.buttonWrapper} pointerEvents='box-none'>
      <TouchableOpacity
        style={[
          styles.floatingButton,
          {
            backgroundColor: theme.background.content,
            borderColor: theme.appBorderColor,
          },
        ]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {isAtTop ? (
          <ArrowDownIcon color={theme.color.mediumdark} />
        ) : (
          <ArrowUpIcon color={theme.color.mediumdark} />
        )}
      </TouchableOpacity>
    </View>
  );
};

export const PositionControlWrapper: React.FC<PositionControlWrapperProps> = ({
  children,
}) => {
  const [isAtTop, setIsAtTop] = useState(globalIsAtTop);
  const [componentHeight, setComponentHeight] = useState(0);
  const translateY = useRef(new Animated.Value(0)).current;
  // const theme = useTheme(); // Unused for now

  // Calculate the offset needed to position component at top
  const calculateOffset = useCallback(() => {
    // Center position is at screenHeight / 2
    // We want to move to TOP_POSITION
    // So we need to move up by (screenHeight / 2 - TOP_POSITION - componentHeight / 2)
    const centerY = screenHeight / 2;
    const targetY = TOP_POSITION + componentHeight / 2;
    return centerY - targetY;
  }, [componentHeight]);

  const handlePositionToggle = () => {
    const newIsAtTop = !isAtTop;

    if (componentHeight === 0) return; // Don't animate if we haven't measured yet

    const offset = calculateOffset();
    const toValue = newIsAtTop ? -offset : 0;

    Animated.timing(translateY, {
      toValue,
      duration: ANIMATION_DURATION,
      useNativeDriver: true,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    }).start();

    setIsAtTop(newIsAtTop);
    globalIsAtTop = newIsAtTop; // Update global state
  };

  // Measure the component height
  const onLayout = useCallback(
    (event: any) => {
      const { height } = event.nativeEvent.layout;
      setComponentHeight(height);

      // If we're supposed to be at top and just measured, apply the offset
      if (globalIsAtTop && height > 0) {
        // Recalculate offset with actual height
        const centerY = screenHeight / 2;
        const targetY = TOP_POSITION + height / 2;
        const offset = centerY - targetY;
        translateY.setValue(-offset);
      }
    },
    [translateY]
  );

  return (
    <>
      <Animated.View
        style={[
          styles.contentWrapper,
          {
            transform: [{ translateY }],
          },
        ]}
      >
        <View onLayout={onLayout}>{children}</View>
      </Animated.View>

      <FloatingButton isAtTop={isAtTop} onPress={handlePositionToggle} />
    </>
  );
};

const styles = StyleSheet.create({
  buttonWrapper: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  contentWrapper: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    width: '100%',
  },
  floatingButton: {
    borderRadius: 4,
    borderWidth: 1,
    bottom: 16,
    padding: 4,
    position: 'absolute',
    right: 50,
  },
});
