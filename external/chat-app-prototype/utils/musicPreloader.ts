import { Image } from 'expo-image';
import {
  AppleMusicMessage,
  VinylRecordMessage,
  Message,
} from '../types/message';
import { appleMusicApi } from '../services/appleMusicApi';
import { formatArtworkUrl } from '../constants/music';

interface PreloadedMusicData {
  songTitle: string;
  artistName: string;
  albumArtUrl: string;
  previewUrl: string | null;
  duration: number;
  colors?: {
    bgColor?: string;
    textColor1?: string;
    textColor2?: string;
    textColor3?: string;
    textColor4?: string;
  };
}

class MusicPreloader {
  private preloadedData: Map<string, PreloadedMusicData> = new Map();
  private isPreloading = false;

  /**
   * Preload music data for all AppleMusic messages in a conversation
   */
  async preloadConversationMusic(messages: Message[]): Promise<Message[]> {
    if (this.isPreloading || !appleMusicApi.isConfigured()) {
      console.log(
        '🎵 Skipping preload: already in progress or Apple Music not configured'
      );
      return messages;
    }

    this.isPreloading = true;
    console.log('🎵 Starting music preload for conversation...');

    try {
      // Find all music messages (AppleMusic and VinylRecord)
      const musicMessages = messages.filter(
        (msg): msg is AppleMusicMessage | VinylRecordMessage =>
          msg.type === 'appleMusic' || msg.type === 'vinylRecord'
      );

      if (musicMessages.length === 0) {
        console.log('🎵 No music messages found, skipping preload');
        return messages;
      }

      console.log(
        `🎵 Found ${musicMessages.length} music message(s) to preload`
      );

      // Preload data for each music message
      const preloadPromises = musicMessages.map(async musicMsg => {
        try {
          // Skip if already preloaded
          if (this.preloadedData.has(musicMsg.songId)) {
            console.log(`🎵 Using cached data for ${musicMsg.songId}`);
            return;
          }

          console.log(`🎵 Preloading data for: ${musicMsg.songId}`);

          let songData = null;
          if (musicMsg.songId.startsWith('search:')) {
            const searchQuery = musicMsg.songId.replace('search:', '');
            const searchResults = await appleMusicApi.searchSongs(
              searchQuery,
              1
            );
            songData = searchResults[0] || null;
          } else {
            songData = await appleMusicApi.getSong(musicMsg.songId);
          }

          if (!songData) {
            console.log(`🎵 No song data found for: ${musicMsg.songId}`);
            return;
          }

          // Format artwork URL
          let artworkUrl = null;
          if (songData.attributes.artwork?.url) {
            artworkUrl = formatArtworkUrl(songData.attributes.artwork.url);

            // Preload the image using expo-image
            try {
              console.log(`🖼️ Preloading album art: ${artworkUrl}`);
              await Image.prefetch(artworkUrl);
              console.log(`🖼️ Album art preloaded successfully`);
            } catch (error) {
              console.log(`🖼️ Failed to preload album art:`, error);
              // Continue anyway
            }
          }

          // Extract dynamic colors if available
          let colors;
          if (songData.attributes.artwork?.bgColor) {
            colors = {
              bgColor: songData.attributes.artwork.bgColor,
              textColor1: songData.attributes.artwork.textColor1,
              textColor2: songData.attributes.artwork.textColor2,
              textColor3: songData.attributes.artwork.textColor3,
              textColor4: songData.attributes.artwork.textColor4,
            };
            console.log(
              `🎨 Extracted dynamic colors for ${songData.attributes.name}`
            );
          }

          // Store preloaded data
          const preloadedData: PreloadedMusicData = {
            songTitle: songData.attributes.name,
            artistName: songData.attributes.artistName,
            albumArtUrl: artworkUrl || '',
            previewUrl: songData.attributes.previews[0]?.url || null,
            duration: Math.floor(songData.attributes.durationInMillis / 1000),
            colors,
          };

          this.preloadedData.set(musicMsg.songId, preloadedData);
          console.log(
            `🎵 Preloaded data cached for: ${songData.attributes.name}`
          );
        } catch (error) {
          console.error(
            `🎵 Failed to preload music data for ${musicMsg.songId}:`,
            error
          );
        }
      });

      // Wait for all preloading to complete
      await Promise.all(preloadPromises);

      // Update messages with preloaded data
      const updatedMessages = messages.map(message => {
        if (message.type === 'appleMusic' || message.type === 'vinylRecord') {
          const preloadedData = this.preloadedData.get(message.songId);
          if (preloadedData) {
            return {
              ...message,
              songTitle: preloadedData.songTitle,
              artistName: preloadedData.artistName,
              albumArtUrl: preloadedData.albumArtUrl,
              previewUrl: preloadedData.previewUrl,
              duration: preloadedData.duration,
              colors: preloadedData.colors,
            } as AppleMusicMessage | VinylRecordMessage;
          }
        }
        return message;
      });

      console.log('🎵 Music preloading completed successfully');
      return updatedMessages;
    } catch (error) {
      console.error('🎵 Music preloading failed:', error);
      return messages;
    } finally {
      this.isPreloading = false;
    }
  }

  /**
   * Get preloaded data for a specific song ID
   */
  getPreloadedData(songId: string): PreloadedMusicData | null {
    return this.preloadedData.get(songId) || null;
  }

  /**
   * Clear all preloaded data
   */
  clearCache(): void {
    this.preloadedData.clear();
    console.log('🎵 Music preloader cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; songIds: string[] } {
    return {
      size: this.preloadedData.size,
      songIds: Array.from(this.preloadedData.keys()),
    };
  }
}

// Export singleton instance
export const musicPreloader = new MusicPreloader();
