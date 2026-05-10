import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SymbolView } from 'expo-symbols';
import BubbleTail from './shared/BubbleTail';
import AlbumArtwork from './shared/AlbumArtwork';
import PlayPauseButton from './shared/PlayPauseButton';
import Reaction from '../chat/Reaction';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { useSongData } from '../../hooks/useSongData';
import { Colors, Typography, Spacing, Layout } from '../../constants/theme';
import { ReactionType } from '../../utils/reactions';
import { handleOpenAppleMusic } from '../../utils/appleMusicHelpers';
import { getDynamicStyles, addTransparency } from '../../utils/colorHelpers';

interface AppleMusicBubbleProps {
  songId: string;
  songTitle?: string;
  artistName?: string;
  albumArtUrl?: string;
  previewUrl?: string;
  duration?: number; // in seconds
  appleMusicId?: string;
  playParams?: {
    id: string;
    kind: string;
  };
  isSender: boolean;
  hasReaction?: boolean;
  reactionType?: ReactionType;
  isLastInGroup?: boolean;
  colors?: {
    bgColor?: string;
    textColor1?: string;
    textColor2?: string;
    textColor3?: string;
    textColor4?: string;
  };
  useDynamicColors?: boolean;
  maxWidth?: string;
  playDisabled?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  caption?: string;
}

const AppleMusicBubble: React.FC<AppleMusicBubbleProps> = ({
  songId,
  songTitle: propSongTitle,
  artistName: propArtistName,
  albumArtUrl: propAlbumArtUrl,
  previewUrl: propPreviewUrl,
  duration: propDuration,
  appleMusicId: propAppleMusicId,
  playParams: propPlayParams,
  isSender,
  hasReaction = false,
  reactionType,
  isLastInGroup = false,
  colors: propColors,
  useDynamicColors = false,
  maxWidth,
  playDisabled = false,
  onPlay,
  onPause,
  caption,
}) => {
  // Use custom hooks for data fetching and audio playback
  const { songData, isLoading } = useSongData({
    songId,
    propSongTitle,
    propArtistName,
    propAlbumArtUrl,
    propPreviewUrl,
    propDuration,
  });

  const { isPlaying, progress, handlePlayPause, hasEverBeenPlayed } =
    useAudioPlayer({
      previewUrl: songData?.previewUrl || null,
      duration: songData?.duration || 30,
    });

  // Determine which colors to use
  const artworkColors = propColors || songData?.colors;
  const shouldUseApiColors = !!(useDynamicColors && artworkColors);

  // Handle opening Apple Music
  const onOpenAppleMusic = async () => {
    await handleOpenAppleMusic({
      propAppleMusicId: propAppleMusicId,
      propPlayParams: propPlayParams,
      songData: songData || undefined,
    });
  };

  // Define dynamic styles based on Apple Music colors
  const dynamicStyles = getDynamicStyles(
    artworkColors,
    isSender,
    shouldUseApiColors
  );

  return (
    <View
      style={[
        styles.container,
        isSender ? styles.senderContainer : styles.recipientContainer,
        hasReaction && styles.containerWithReaction,
        // @ts-expect-error - maxWidth type mismatch
        maxWidth && { maxWidth },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.bubble,
          isSender ? styles.senderBubble : styles.recipientBubble,
          { backgroundColor: dynamicStyles.bubbleBackground },
        ]}
        onPress={onOpenAppleMusic}
        activeOpacity={0.8}
      >
        <View style={styles.content}>
          <View style={styles.albumArt}>
            <AlbumArtwork
              url={
                typeof songData?.albumArt === 'string'
                  ? songData.albumArt
                  : null
              }
              size={50}
              borderRadius={4}
              isSender={isSender}
              isPreloaded={!!propAlbumArtUrl} // Mark as preloaded if we passed in albumArtUrl directly
              placeholderBackgroundColor={
                shouldUseApiColors
                  ? addTransparency(artworkColors.textColor4, 0.4)
                  : undefined
              }
              onError={() => {}}
            />
          </View>

          <View style={styles.songInfo}>
            <Text
              style={[
                styles.songTitle,
                isSender ? styles.senderText : styles.recipientText,
                { color: dynamicStyles.titleColor },
              ]}
              numberOfLines={2}
            >
              {isLoading ? 'Loading...' : songData?.title || 'Unknown Song'}
            </Text>
            <Text
              style={[
                styles.artistName,
                isSender ? styles.senderText : styles.recipientText,
                { color: dynamicStyles.artistColor },
              ]}
              numberOfLines={1}
            >
              {isLoading ? 'Loading...' : songData?.artist || 'Unknown Artist'}
            </Text>
            <View style={styles.appleMusicRow}>
              <SymbolView
                name='applelogo'
                size={12}
                type='hierarchical'
                tintColor={dynamicStyles.iconColor}
                style={styles.appleIcon}
              />
              <Text
                style={[
                  styles.musicText,
                  isSender ? styles.senderText : styles.recipientText,
                  { color: dynamicStyles.labelColor },
                ]}
              >
                Music
              </Text>
            </View>
          </View>

          <View onStartShouldSetResponder={() => true}>
            <PlayPauseButton
              isPlaying={isPlaying}
              isLoading={isLoading}
              progress={progress}
              onPress={() => {
                if (!isLoading && !playDisabled) {
                  handlePlayPause();
                  // Call action callbacks for Storybook
                  if (isPlaying) {
                    onPause?.();
                  } else {
                    onPlay?.();
                  }
                }
              }}
              isSender={isSender}
              size={30}
              disabled={isLoading || playDisabled}
              hasEverBeenPlayed={hasEverBeenPlayed}
              backgroundStrokeColor={dynamicStyles.backgroundStrokeColor}
            />
          </View>
        </View>
      </TouchableOpacity>

      {caption ? (
        <View
          style={[
            styles.captionBubble,
            isSender
              ? styles.captionBubbleSender
              : styles.captionBubbleRecipient,
          ]}
        >
          <Text
            style={[
              styles.captionText,
              isSender ? styles.captionTextSender : styles.captionTextRecipient,
            ]}
          >
            {caption}
          </Text>
        </View>
      ) : null}

      {hasReaction && reactionType && (
        <Reaction reactionType={reactionType} isSender={isSender} />
      )}

      {isLastInGroup && (
        <View style={isSender ? styles.senderTail : styles.recipientTail}>
          <BubbleTail
            color={
              caption
                ? isSender
                  ? Colors.messageBubbleBlue
                  : Colors.messageBubbleGray
                : dynamicStyles.bubbleBackground
            }
            size={16}
            flipped={!isSender}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  albumArt: {
    marginRight: 8,
  },
  appleIcon: {
    marginRight: 1,
  },
  appleMusicRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
  },
  artistName: {
    fontFamily: Typography.fontFamily,
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: -0.15,
    lineHeight: 16,
    marginBottom: 2,
  },
  bubble: {
    borderRadius: Spacing.messageBorderRadius,
    paddingHorizontal: 11,
    paddingVertical: 9,
  },
  captionBubble: {
    borderRadius: Spacing.messageBorderRadius,
    marginTop: 1,
    paddingHorizontal: Spacing.messagePadding,
    paddingVertical: Spacing.messagePaddingVertical,
  },
  captionBubbleRecipient: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.messageBubbleGray,
  },
  captionBubbleSender: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.messageBubbleBlue,
  },
  captionText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.message,
    fontWeight: Typography.regular,
    letterSpacing: -0.15,
    lineHeight: Typography.messageLineHeight,
  },
  captionTextRecipient: {
    color: Colors.black,
  },
  captionTextSender: {
    color: Colors.white,
    opacity: 0.9,
  },
  container: {
    marginVertical: 0.5,
    maxWidth: Layout.maxMessageWidth,
    position: 'relative',
  },
  containerWithReaction: {
    paddingTop: 20,
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 50,
  },
  musicText: {
    fontFamily: Typography.fontFamily,
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: -0.15,
    lineHeight: 16,
  },
  recipientBubble: {
    alignSelf: 'flex-start',
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
    opacity: 1,
  },
  senderBubble: {
    alignSelf: 'flex-end',
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
    opacity: 1,
  },
  songInfo: {
    flexShrink: 1,
    justifyContent: 'space-between',
    maxWidth: 180,
    minHeight: 44,
    paddingHorizontal: 4,
    paddingRight: 11,
  },
  songTitle: {
    fontFamily: Typography.fontFamily,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.15,
    lineHeight: 18,
    marginBottom: 2,
  },
});

export default AppleMusicBubble;
