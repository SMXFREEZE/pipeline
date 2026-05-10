import { Animated } from 'react-native';

// Animation constants
const ANIMATION_DURATIONS = {
  DELIVERED_FADE: 300,
  TYPING_INDICATOR: 300,
  CHAT_SLIDE: 300,
  CHAT_SLIDE_FAST: 150,
} as const;

// Animation offsets
const ANIMATION_OFFSETS = {
  USER_MESSAGE_SLIDE: 20,
  AI_MESSAGE_SLIDE: 0,
  CHAT_SLIDE: 30,
} as const;

export const ANIMATION_DELAYS = {
  DELIVERED_SHOW: 2000,
  AI_RESPONSE_START: 1500,
  AI_RESPONSE_MIN: 2000,
  CHAT_SLIDE_PAUSE: 1000,
  MESSAGE_RENDER: 150, // Increased for longer AI responses
} as const;

const SPRING_CONFIG = {
  MESSAGE_SLIDE: {
    velocity: 2,
    tension: 120,
    friction: 8,
  },
} as const;

/**
 * Create animation values for a new message
 */
export const createMessageAnimationValues = () => ({
  animationValue: new Animated.Value(0),
  deliveredOpacity: new Animated.Value(0),
  deliveredScale: new Animated.Value(0.7),
});

/**
 * Animate message sliding up from input area
 */
export const animateMessageSlideUp = (animationValue: Animated.Value) => {
  return Animated.spring(animationValue, {
    toValue: 1,
    useNativeDriver: true,
    ...SPRING_CONFIG.MESSAGE_SLIDE,
  });
};

/**
 * Animate delivered indicator fade in with scale
 */
export const animateDeliveredFadeIn = (
  opacity: Animated.Value,
  scale: Animated.Value
) => {
  return Animated.parallel([
    Animated.timing(opacity, {
      toValue: 1,
      duration: ANIMATION_DURATIONS.DELIVERED_FADE,
      useNativeDriver: true,
    }),
    Animated.timing(scale, {
      toValue: 1,
      duration: ANIMATION_DURATIONS.DELIVERED_FADE,
      useNativeDriver: true,
    }),
  ]);
};

/**
 * Animate delivered indicator fade out
 */
export const animateDeliveredFadeOut = (
  opacity: Animated.Value,
  scale: Animated.Value
) => {
  return Animated.parallel([
    Animated.timing(opacity, {
      toValue: 0,
      duration: ANIMATION_DURATIONS.DELIVERED_FADE,
      useNativeDriver: true,
    }),
    Animated.timing(scale, {
      toValue: 0.7,
      duration: ANIMATION_DURATIONS.DELIVERED_FADE,
      useNativeDriver: true,
    }),
  ]);
};

/**
 * Animate typing indicator fade in
 */
export const animateTypingIndicatorIn = (opacity: Animated.Value) => {
  return Animated.timing(opacity, {
    toValue: 1,
    duration: ANIMATION_DURATIONS.TYPING_INDICATOR,
    useNativeDriver: true,
  });
};

/**
 * Animate typing indicator fade out
 */
const animateTypingIndicatorOut = (opacity: Animated.Value) => {
  return Animated.timing(opacity, {
    toValue: 0,
    duration: ANIMATION_DURATIONS.TYPING_INDICATOR,
    useNativeDriver: true,
  });
};

/**
 * Animate chat sliding down to hide typing indicator space
 */
const animateChatSlideDown = (slideValue: Animated.Value) => {
  return Animated.timing(slideValue, {
    toValue: 1,
    duration: ANIMATION_DURATIONS.CHAT_SLIDE,
    useNativeDriver: true,
  });
};

/**
 * Animate chat sliding back up to normal position
 */
export const animateChatSlideUp = (slideValue: Animated.Value) => {
  return Animated.timing(slideValue, {
    toValue: 0,
    duration: ANIMATION_DURATIONS.CHAT_SLIDE_FAST,
    useNativeDriver: true,
  });
};

/**
 * Create crossfade animation between typing indicator and message
 */
export const createCrossfadeAnimation = (
  typingOpacity: Animated.Value,
  chatSlideDown: Animated.Value
) => {
  return Animated.parallel([
    animateTypingIndicatorOut(typingOpacity),
    animateChatSlideDown(chatSlideDown),
  ]);
};

/**
 * Get transform styles for message slide animation
 */
export const getMessageSlideTransform = (
  animationValue: Animated.Value | undefined,
  isSender: boolean
) => {
  if (!animationValue) return [];

  const offset = isSender
    ? ANIMATION_OFFSETS.USER_MESSAGE_SLIDE
    : ANIMATION_OFFSETS.AI_MESSAGE_SLIDE;

  return [
    {
      translateY: animationValue.interpolate({
        inputRange: [0, 1],
        outputRange: [offset, 0],
      }),
    },
  ];
};

/**
 * Get transform styles for chat slide animation
 */
export const getChatSlideTransform = (slideValue: Animated.Value) => {
  return [
    {
      translateY: slideValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0, ANIMATION_OFFSETS.CHAT_SLIDE],
      }),
    },
  ];
};

/**
 * Get transform styles for delivered indicator scale
 */
export const getDeliveredScaleTransform = (
  scale: Animated.Value | undefined,
  fallbackScale: Animated.Value
) => {
  const scaleValue = scale || fallbackScale;
  return [{ scale: scaleValue }]; // Changed from scaleX to scale for uniform scaling
};
