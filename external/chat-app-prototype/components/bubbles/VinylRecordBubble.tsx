import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useAudioPlayer } from 'expo-audio';
import { SymbolView } from 'expo-symbols';
import BubbleTail from './shared/BubbleTail';
import VinylPlayPauseButton from './shared/VinylPlayPauseButton';
import { Colors, Typography, Layout } from '../../constants/theme';
import { VinylColors, VinylSizes } from '../../constants/components/Vinyl';
import { VinylRecordMessage } from '../../types/message';
import { useSongData } from '../../hooks/useSongData';
import { getDynamicStyles } from '../../utils/colorHelpers';

const { width: screenWidth } = Dimensions.get('window');
const VINYL_SIZE = VinylSizes.vinylSize;
const CENTER_HOLE_SIZE = VinylSizes.centerHoleSize;

interface VinylRecordBubbleProps {
  message: VinylRecordMessage;
}

const VinylRecordBubble: React.FC<VinylRecordBubbleProps> = ({ message }) => {
  const player = useAudioPlayer();
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [wasPlayingBeforeScrub, setWasPlayingBeforeScrub] = useState(false);

  const spinValue = useRef(new Animated.Value(0)).current;
  const progressValue = useRef(new Animated.Value(0)).current;
  const progressAnimatedValue = useRef(new Animated.Value(0)).current; // For PlayPauseButton
  const spinAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const progressAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const currentRotation = useRef(0);

  // Use the useSongData hook to fetch song data
  const { songData, isLoading } = useSongData({
    songId: message.songId,
    propSongTitle: message.songTitle,
    propArtistName: message.artistName,
    propAlbumArtUrl: message.albumArtUrl,
    propPreviewUrl: message.previewUrl,
    propDuration: message.duration,
  });

  // Determine which colors to use (from message props or fetched data)
  const artworkColors = message.colors || songData?.colors;
  // Enable dynamic colors by default (unless explicitly set to false)
  const shouldUseApiColors = !!(
    message.useDynamicColors !== false && artworkColors
  );

  // Get dynamic styles based on colors
  const dynamicStyles = getDynamicStyles(
    artworkColors,
    message.isSender,
    shouldUseApiColors
  );

  // Track playing state
  useEffect(() => {
    if (player) {
      setIsPlaying(player.playing);
    }
  }, [player, player.playing]);

  // Track duration (only when it changes)
  useEffect(() => {
    if (player && player.duration > 0) {
      setDuration(player.duration * 1000); // Convert to milliseconds
    }
  }, [player, player.duration]);

  // Update position and progress during playback (using a timer instead of continuous effect)
  useEffect(() => {
    if (!player || !isPlaying || isScrubbing) return;

    const interval = setInterval(() => {
      if (player.duration > 0) {
        const currentTime = player.currentTime * 1000; // Convert to milliseconds
        setPosition(currentTime);

        const progress = player.currentTime / player.duration;
        progressValue.setValue(progress);
        progressAnimatedValue.setValue(progress);

        // Handle track end — seek back to start so a replay begins from 0
        if (player.currentTime >= player.duration) {
          setIsPlaying(false);
          setPosition(0);
          progressValue.setValue(0);
          progressAnimatedValue.setValue(0);
          player.seekTo(0).catch(() => {});
        }
      }
    }, 100); // Update every 100ms

    return () => clearInterval(interval);
  }, [
    isPlaying,
    isScrubbing,
    player,
    progressValue,
    progressAnimatedValue,
    spinValue,
  ]);

  // Setup audio with expo-audio
  useEffect(() => {
    if (songData?.previewUrl && player) {
      player.replace({ uri: songData.previewUrl });
    }
  }, [songData?.previewUrl, player]);

  // Spinning and progress animations
  useEffect(() => {
    if (isPlaying && !isScrubbing) {
      // Vinyl records typically spin at 33 1/3 RPM
      // That's 33.33 rotations per minute = 0.555 rotations per second
      // So one rotation takes about 1.8 seconds
      const rotationDuration = 1800; // milliseconds per rotation

      // Calculate how many rotations we need for the remaining song duration
      const remainingTime = duration > 0 ? duration - position : 30000; // Default 30 seconds if no duration
      const totalRotations = Math.ceil(remainingTime / rotationDuration);

      // Get current rotation value and continue from there
      // @ts-expect-error - accessing private _value property for smooth animation continuation
      const currentValue = spinValue._value || 0;
      const targetValue = currentValue + 360 * totalRotations;

      spinAnimation.current = Animated.timing(spinValue, {
        toValue: targetValue,
        duration: totalRotations * rotationDuration,
        useNativeDriver: true,
        easing: Easing.linear,
      });

      spinAnimation.current.start();

      // Animate both progress bars smoothly
      if (duration > 0) {
        const remainingTime = duration - position;

        // For the disabled progress bar UI
        progressAnimation.current = Animated.timing(progressValue, {
          toValue: 1,
          duration: remainingTime,
          useNativeDriver: false,
          easing: t => t,
        });
        progressAnimation.current.start();

        // For the PlayPauseButton progress ring
        Animated.timing(progressAnimatedValue, {
          toValue: 1,
          duration: remainingTime,
          useNativeDriver: false,
          easing: t => t,
        }).start();
      }
    } else {
      // Stop animations if not playing OR if scrubbing
      if (spinAnimation.current) {
        spinAnimation.current.stop();
        // Store current rotation value when stopping
        spinValue.stopAnimation(value => {
          currentRotation.current = value;
        });
      }
      if (progressAnimation.current) {
        progressAnimation.current.stop();
      }
      // Also stop the play button progress animation
      progressAnimatedValue.stopAnimation();
    }
  }, [
    isPlaying,
    isScrubbing,
    duration,
    position,
    progressAnimatedValue,
    progressValue,
    spinValue,
  ]);

  const handlePlayPause = async () => {
    if (!player) {
      return;
    }

    try {
      if (isPlaying) {
        player.pause();
        setIsPlaying(false);
        // Store the current progress value
        progressValue.stopAnimation();
        progressAnimatedValue.stopAnimation();
      } else {
        // If the track is at (or past) the end, restart from the beginning
        if (
          player.duration > 0 &&
          player.currentTime >= player.duration - 0.05
        ) {
          await player.seekTo(0).catch(() => {});
          setPosition(0);
          progressValue.setValue(0);
          progressAnimatedValue.setValue(0);
        } else if (player.duration > 0) {
          // Update progress values before playing
          const currentProgress = player.currentTime / player.duration;
          progressValue.setValue(currentProgress);
          progressAnimatedValue.setValue(currentProgress);
        }
        player.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('🎵 Error in play/pause:', error);
    }
  };

  // --- Drag-to-scrub gesture ---
  const lastAngle = useRef(0);
  const scrubPosition = useRef(0); // tracks seek position locally during drag
  const lastSeekTime = useRef(0);
  const DRAG_THRESHOLD = 5; // px before entering scrub mode
  // One full 360° drag = 5 seconds of audio
  const SECONDS_PER_ROTATION = 5;

  const getAngle = useCallback((touchX: number, touchY: number) => {
    const dx = touchX - VINYL_SIZE / 2;
    const dy = touchY - VINYL_SIZE / 2;
    return Math.atan2(dy, dx) * (180 / Math.PI);
  }, []);

  // Normalize angle delta to handle wrap-around at ±180°
  const normalizeAngleDelta = useCallback((delta: number) => {
    while (delta > 180) delta -= 360;
    while (delta < -180) delta += 360;
    return delta;
  }, []);

  const panGesture = Gesture.Pan()
    .runOnJS(true)
    .minDistance(DRAG_THRESHOLD)
    .onStart(e => {
      // Pan activated (finger moved past threshold) — enter scrub mode
      scrubPosition.current = player ? player.currentTime : 0;
      setWasPlayingBeforeScrub(isPlaying);
      setIsScrubbing(true);
      if (player && isPlaying) {
        player.pause();
        setIsPlaying(false);
      }
      lastAngle.current = getAngle(e.x, e.y);
    })
    .onUpdate(e => {
      const currentAngle = getAngle(e.x, e.y);
      const angleDelta = normalizeAngleDelta(currentAngle - lastAngle.current);
      lastAngle.current = currentAngle;

      // Update vinyl rotation directly
      // @ts-expect-error - accessing private _value for direct manipulation
      const currentSpin = spinValue._value || 0;
      spinValue.setValue(currentSpin + angleDelta);

      // Map rotation to time: clockwise = forward
      if (player && player.duration > 0) {
        const timeDeltaSec = (angleDelta / 360) * SECONDS_PER_ROTATION;
        scrubPosition.current = Math.max(
          0,
          Math.min(player.duration, scrubPosition.current + timeDeltaSec)
        );

        const newProgress = scrubPosition.current / player.duration;
        progressValue.setValue(newProgress);
        progressAnimatedValue.setValue(newProgress);
        setPosition(scrubPosition.current * 1000);

        // Throttle actual audio seeks to every 50ms
        const now = Date.now();
        if (now - lastSeekTime.current > 50) {
          player.seekTo(scrubPosition.current).catch(() => {});
          lastSeekTime.current = now;
        }
      }
    })
    .onEnd(() => {
      // Seek to final position and resume if was playing
      if (player && player.duration > 0) {
        player.seekTo(scrubPosition.current).catch(() => {});
      }
      setIsScrubbing(false);
      if (wasPlayingBeforeScrub && player) {
        player.play();
        setIsPlaying(true);
      }
    });

  const tapGesture = Gesture.Tap()
    .runOnJS(true)
    .onEnd(() => {
      handlePlayPause();
    });

  // Pan takes priority over tap — if finger moves past threshold, tap is cancelled
  const composedGesture = Gesture.Exclusive(panGesture, tapGesture);

  const spin = spinValue.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
    extrapolate: 'extend',
  });

  if (isLoading || !songData) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        message.isSender ? styles.containerSender : styles.containerRecipient,
      ]}
    >
      <View style={styles.bubbleContainer}>
        <View
          style={[
            styles.backgroundGradient,
            { backgroundColor: dynamicStyles.bubbleBackground },
          ]}
        >
          {/* Album art background with blur - positioned behind vinyl area */}
          <View style={styles.vinylAreaBackground}>
            <Image
              source={{ uri: songData.albumArt || '' }}
              style={styles.vinylAreaBackgroundImage}
              contentFit='cover'
              priority='high'
              cachePolicy='memory-disk'
              transition={message.albumArtUrl ? 0 : 200}
            />
            <BlurView
              intensity={25}
              tint='systemThickMaterial'
              style={styles.vinylAreaBlur}
            />
            <View
              style={[
                styles.colorTint,
                styles.colorTintWithOpacity,
                {
                  backgroundColor: shouldUseApiColors
                    ? dynamicStyles.bubbleBackground
                    : message.isSender
                    ? Colors.messageBubbleBlue
                    : Colors.messageBubbleGray,
                },
              ]}
            />
          </View>

          {/* Vinyl Record */}
          <GestureDetector gesture={composedGesture}>
            <View style={[styles.vinylContainer, styles.contentAbove]}>
              <Animated.View
                style={[styles.vinyl, { transform: [{ rotate: spin }] }]}
              >
                {/* Record grooves */}
                <View style={styles.vinylGrooves}>
                  {[...Array(6)].map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.groove,
                        {
                          width: VINYL_SIZE - i * 15,
                          height: VINYL_SIZE - i * 15,
                          borderRadius: (VINYL_SIZE - i * 15) / 2,
                        },
                      ]}
                    />
                  ))}
                </View>

                {/* Album art center */}
                <View style={styles.albumArtContainer}>
                  <Image
                    source={{ uri: songData.albumArt || '' }}
                    style={styles.albumArt}
                    contentFit='cover'
                    priority='high'
                    cachePolicy='memory-disk'
                    transition={message.albumArtUrl ? 0 : 200}
                  />
                </View>

                {/* Center hole */}
                <View style={styles.centerHole} />

                {/* Highlight effect */}
                <LinearGradient
                  colors={['rgba(255,255,255,0.1)', 'transparent']}
                  style={styles.vinylHighlight}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
              </Animated.View>
            </View>
          </GestureDetector>

          {/* Bottom section with song info and controls */}
          <View style={[styles.bottomSection, styles.contentAbove]}>
            {/* Left side: Song info */}
            <View style={styles.songInfo}>
              <Text
                style={[styles.songTitle, { color: dynamicStyles.titleColor }]}
                numberOfLines={1}
              >
                {songData.title}
              </Text>
              <Text
                style={[
                  styles.artistName,
                  { color: dynamicStyles.artistColor },
                ]}
                numberOfLines={1}
              >
                {songData.artist}
              </Text>
              {/* Apple Music row */}
              <View style={styles.appleMusicRow}>
                <SymbolView
                  name='applelogo'
                  size={12}
                  type='hierarchical'
                  tintColor={dynamicStyles.iconColor}
                  style={styles.appleLogo}
                />
                <Text
                  style={[
                    styles.musicText,
                    { color: dynamicStyles.labelColor },
                  ]}
                >
                  Music
                </Text>
              </View>
            </View>

            {/* Right side: Play/Pause button */}
            <View onStartShouldSetResponder={() => true}>
              <VinylPlayPauseButton
                isPlaying={isPlaying}
                isScrubbing={isScrubbing}
                progress={progressAnimatedValue}
                onPress={handlePlayPause}
                isSender={message.isSender}
                size={30}
                hasEverBeenPlayed={
                  position > 0 || isPlaying || wasPlayingBeforeScrub
                }
                backgroundStrokeColor={
                  shouldUseApiColors
                    ? dynamicStyles.backgroundStrokeColor
                    : undefined
                }
              />
            </View>
          </View>
        </View>

        {/* Tail positioned absolutely */}
        <View
          style={message.isSender ? styles.senderTail : styles.recipientTail}
        >
          <BubbleTail
            color={dynamicStyles.bubbleBackground}
            size={16}
            flipped={!message.isSender}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  albumArt: {
    height: '100%',
    width: '100%',
  },
  albumArtContainer: {
    backgroundColor: VinylColors.vinylAlbumBackground,
    borderRadius: CENTER_HOLE_SIZE / 2,
    height: CENTER_HOLE_SIZE,
    overflow: 'hidden',
    width: CENTER_HOLE_SIZE,
  },
  appleLogo: {
    marginRight: 2,
  },
  appleMusicRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  artistName: {
    fontSize: Typography.timestamp,
    marginBottom: 4,
  },
  backgroundGradient: {
    borderRadius: 20,
    minWidth: 200,
    padding: 12,
    position: 'relative',
  },
  bottomSection: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingTop: 24,
  },
  bubbleContainer: {
    flexDirection: 'row',
    position: 'relative',
  },
  centerHole: {
    backgroundColor: VinylColors.vinylBlack,
    borderRadius: 4,
    height: 8,
    position: 'absolute',
    width: 8,
  },
  colorTint: {
    height: '100%',
    left: 0,
    position: 'absolute',
    top: 0,
    width: '100%',
  },
  colorTintWithOpacity: {
    opacity: VinylColors.colorTintOpacity,
  },
  container: {
    flexDirection: 'row',
    marginVertical: 0.5,
    maxWidth: screenWidth * 0.75,
  },
  containerRecipient: {
    alignSelf: 'flex-start',
    marginRight: Layout.messageMarginSide,
  },
  containerSender: {
    alignSelf: 'flex-end',
    marginLeft: Layout.messageMarginSide,
  },
  contentAbove: {
    position: 'relative',
    zIndex: 1,
  },
  groove: {
    borderColor: VinylColors.vinylGroove,
    borderWidth: 0.5,
    position: 'absolute',
  },
  loadingContainer: {
    backgroundColor: Colors.messageBubbleGray,
    borderRadius: 20,
    padding: 20,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: Typography.message,
  },
  musicText: {
    fontSize: 12,
    fontWeight: '600',
  },
  recipientTail: {
    bottom: 0.5,
    left: -5.5,
    position: 'absolute',
    zIndex: 10,
  },
  senderTail: {
    bottom: 0.5,
    position: 'absolute',
    right: -5.5,
    zIndex: 10,
  },
  songInfo: {
    flex: 1,
    marginRight: 8,
  },
  songTitle: {
    fontSize: Typography.message,
    fontWeight: '600',
    marginBottom: 2,
  },
  vinyl: {
    alignItems: 'center',
    backgroundColor: VinylColors.vinylOverlay,
    borderRadius: VINYL_SIZE / 2,
    elevation: 8,
    height: VINYL_SIZE,
    justifyContent: 'center',
    position: 'relative',
    shadowColor: VinylColors.vinylShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    width: VINYL_SIZE,
    zIndex: 1,
  },
  vinylAreaBackground: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: VINYL_SIZE + 56, // vinyl height + extended bottom
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 0,
  },
  vinylAreaBackgroundImage: {
    height: '100%',
    width: '100%',
  },
  vinylAreaBlur: {
    height: '100%',
    left: 0,
    position: 'absolute',
    top: 0,
    width: '100%',
  },
  vinylContainer: {
    alignSelf: 'center',
    height: VINYL_SIZE,
    marginBottom: 16,
    marginTop: 16,
    position: 'relative',
    width: VINYL_SIZE,
  },
  vinylGrooves: {
    alignItems: 'center',
    height: VINYL_SIZE,
    justifyContent: 'center',
    position: 'absolute',
    width: VINYL_SIZE,
  },
  vinylHighlight: {
    borderRadius: VINYL_SIZE / 2,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});

export default VinylRecordBubble;
