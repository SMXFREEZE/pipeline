import { Linking } from 'react-native';

interface AppleMusicUrlParams {
  propAppleMusicId?: string;
  propPlayParams?: { id: string; kind: string };
  songData?: {
    id?: string;
    playParams?: { id: string; kind: string };
    title?: string;
    artist?: string;
  };
}

/**
 * Builds Apple Music URL from various ID sources
 */
const buildAppleMusicUrl = ({
  propAppleMusicId,
  propPlayParams,
  songData,
}: AppleMusicUrlParams): string | null => {
  // First try to use the message-level Apple Music ID (from AI response)
  if (propAppleMusicId) {
    return `https://music.apple.com/song/${propAppleMusicId}`;
  }

  // Alternative: use message-level playParams ID
  if (propPlayParams?.id) {
    return `https://music.apple.com/song/${propPlayParams.id}`;
  }

  // Use songData Apple Music ID (from useSongData hook)
  if (songData?.id) {
    return `https://music.apple.com/song/${songData.id}`;
  }

  // Alternative: use songData playParams ID
  if (songData?.playParams?.id) {
    return `https://music.apple.com/song/${songData.playParams.id}`;
  }

  // Fallback to search if no direct ID is available
  if (songData?.title && songData?.artist) {
    const query = encodeURIComponent(`${songData.title} ${songData.artist}`);
    return `https://music.apple.com/search?term=${query}`;
  }

  return null;
};

/**
 * Opens Apple Music with fallback URL schemes
 */
const openAppleMusic = async (url: string): Promise<boolean> => {
  // Try multiple URL schemes for better compatibility
  const urlSchemes = [
    url,
    url.replace('https://', 'music://'),
    url.replace('https://music.apple.com', 'itmss://music.apple.com'),
  ];

  for (const schemeUrl of urlSchemes) {
    try {
      const supported = await Linking.canOpenURL(schemeUrl);
      if (supported) {
        await Linking.openURL(schemeUrl);
        return true;
      }
    } catch {
      // Silently continue to next scheme
    }
  }

  return false;
};

/**
 * Main handler for opening Apple Music from bubble
 */
export const handleOpenAppleMusic = async (
  params: AppleMusicUrlParams
): Promise<void> => {
  try {
    const appleMusicUrl = buildAppleMusicUrl(params);

    if (appleMusicUrl) {
      await openAppleMusic(appleMusicUrl);
    }
  } catch {
    // Silently fail
  }
};
