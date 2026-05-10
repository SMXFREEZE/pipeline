import { URLParser, URLPreview } from '../types';

export const appleMusicParser: URLParser = {
  name: 'AppleMusic',
  pattern: /https:\/\/music\.apple\.com\/[^\s]+\/(\d+)(\?i=(\d+))?/,

  canHandle(url: string): boolean {
    return this.pattern.test(url);
  },

  async parse(url: string, _text: string): Promise<URLPreview | null> {
    const match = url.match(this.pattern);
    if (!match) return null;

    const albumId = match[1];
    const trackId = match[3] || match[1];

    return {
      id: `apple-music-${trackId}`,
      type: 'appleMusic',
      url,
      metadata: {
        songId: trackId,
        albumId,
        // Additional metadata can be populated by the component itself
        // using existing hooks like useSongData
      },
    };
  },
};
