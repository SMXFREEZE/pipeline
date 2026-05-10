import React from 'react';
import { TouchableOpacity, View, StyleSheet, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { SymbolView } from 'expo-symbols';
import { Colors } from '../../../constants/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface VinylPlayPauseButtonProps {
  isPlaying: boolean;
  isScrubbing: boolean; // New prop to track scrubbing state
  progress: Animated.Value;
  onPress: () => void;
  isSender?: boolean;
  size?: number;
  disabled?: boolean;
  hasEverBeenPlayed?: boolean;
  backgroundStrokeColor?: string;
}

const VinylPlayPauseButton: React.FC<VinylPlayPauseButtonProps> = ({
  isPlaying,
  isScrubbing,
  progress,
  onPress,
  isSender = false,
  size = 30,
  disabled = false,
  hasEverBeenPlayed = false,
  backgroundStrokeColor,
}) => {
  const radius = (size - 4) / 2; // Account for 2px stroke width
  const circumference = 2 * Math.PI * radius;

  const strokeDashoffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  const iconSize = Math.floor(size * 0.43); // Scale icon relative to button size

  // Determine visual state based on play status
  const isInitialState = !hasEverBeenPlayed;

  // Show pause icon if playing OR if we're scrubbing and it was playing before
  const showPauseIcon = isPlaying || (isScrubbing && hasEverBeenPlayed);

  return (
    <TouchableOpacity
      style={{ width: size, height: size }}
      onPress={onPress}
      activeOpacity={disabled ? 1 : 0.7}
      disabled={disabled}
    >
      <View style={[styles.playButtonInner, { width: size, height: size }]}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background circle - filled red when never played */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={
              isInitialState
                ? Colors.systemRed
                : backgroundStrokeColor ||
                  (isSender ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.2)')
            }
            strokeWidth='2'
            fill={isInitialState ? Colors.systemRed : 'none'}
            opacity={disabled ? 0.8 : 1}
          />
          {/* Progress circle - only show after first play */}
          {!isInitialState && (
            <AnimatedCircle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={Colors.systemRed}
              strokeWidth='2'
              fill='none'
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              opacity={disabled ? 0.8 : 1}
            />
          )}
        </Svg>
        <SymbolView
          name={showPauseIcon ? 'pause.fill' : 'play.fill'}
          size={iconSize}
          type='hierarchical'
          tintColor={isInitialState ? Colors.white : Colors.systemRed}
          style={[styles.playIcon, disabled && styles.disabledIcon]}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  disabledIcon: {
    opacity: 0.5,
  },
  playButtonInner: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  playIcon: {
    position: 'absolute',
  },
});

export default VinylPlayPauseButton;
