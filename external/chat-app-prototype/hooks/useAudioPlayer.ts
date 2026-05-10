import { useState, useRef, useEffect } from 'react';
import { Animated } from 'react-native';
import {
  useAudioPlayer as useExpoAudioPlayer,
  AudioPlayer,
  setAudioModeAsync,
} from 'expo-audio';

interface UseAudioPlayerProps {
  previewUrl: string | null;
  duration?: number;
}

interface UseAudioPlayerReturn {
  isPlaying: boolean;
  progress: Animated.Value;
  handlePlayPause: () => void;
  hasEverBeenPlayed: boolean;
}

export const useAudioPlayer = ({
  previewUrl,
  duration = 30,
}: UseAudioPlayerProps): UseAudioPlayerReturn => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasEverBeenPlayed, setHasEverBeenPlayed] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const playerRef = useRef<AudioPlayer | null>(null);

  // Initialize audio player when previewUrl is available
  const player = useExpoAudioPlayer(previewUrl ? { uri: previewUrl } : null);

  useEffect(() => {
    if (player) {
      playerRef.current = player;
    }
  }, [player]);

  // Handle audio playback state changes
  useEffect(() => {
    if (isPlaying && previewUrl && playerRef.current) {
      const playAudio = async () => {
        try {
          // Configure audio session for device playback
          await setAudioModeAsync({
            playsInSilentMode: true,
            allowsRecording: false,
          });

          // Play the audio
          playerRef.current?.play();

          // Start progress animation (30 seconds for preview)
          const previewDuration = 30000; // 30 seconds
          animationRef.current = Animated.timing(progress, {
            toValue: 1,
            duration: previewDuration,
            useNativeDriver: true,
          });

          animationRef.current.start(({ finished }) => {
            if (finished) {
              setIsPlaying(false);
              progress.setValue(0);
              // Reset to unplayed state when song completes
              setHasEverBeenPlayed(false);
              // Reset audio position for replay
              playerRef.current?.seekTo(0);
            }
          });
        } catch (error) {
          console.error('Error playing audio:', error);
          setIsPlaying(false);
          progress.setValue(0);
        }
      };

      playAudio();
    } else if (!isPlaying && playerRef.current) {
      // Pause audio and stop animation
      playerRef.current.pause();
      animationRef.current?.stop();
    }

    return () => {
      animationRef.current?.stop();
    };
  }, [isPlaying, previewUrl, progress]);

  const handlePlayPause = () => {
    // Mark as ever been played when user first interacts
    if (!hasEverBeenPlayed) {
      setHasEverBeenPlayed(true);
    }

    if (!isPlaying && previewUrl === null) {
      // No preview available, just show animation
      const animationDuration = duration * 1000; // Convert to milliseconds
      animationRef.current = Animated.timing(progress, {
        toValue: 1,
        duration: animationDuration,
        useNativeDriver: true,
      });

      animationRef.current.start(({ finished }) => {
        if (finished) {
          setIsPlaying(false);
          progress.setValue(0);
          // Reset to unplayed state when animation completes (for no preview case)
          setHasEverBeenPlayed(false);
        }
      });
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  return {
    isPlaying,
    progress,
    handlePlayPause,
    hasEverBeenPlayed,
  };
};
