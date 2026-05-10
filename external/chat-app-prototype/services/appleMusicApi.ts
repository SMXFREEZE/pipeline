// Apple Music API service for fetching song data and preview URLs
// Note: You'll need to get a Developer Token from Apple Developer Portal
// https://developer.apple.com/documentation/applemusicapi/getting_keys_and_creating_tokens

// Global fetch is available in React Native
declare const fetch: any;

interface AppleMusicSong {
  id: string;
  type: 'songs';
  attributes: {
    name: string;
    artistName: string;
    albumName: string;
    artwork: {
      url: string;
      width: number;
      height: number;
      bgColor?: string;
      textColor1?: string;
      textColor2?: string;
      textColor3?: string;
      textColor4?: string;
    };
    previews: Array<{
      url: string;
    }>;
    durationInMillis: number;
    playParams?: {
      id: string;
      kind: 'song';
    };
  };
}

interface AppleMusicApiResponse {
  data: AppleMusicSong[];
}

class AppleMusicApiService {
  private baseUrl = 'https://api.music.apple.com/v1';
  private developerToken: string | null = null;
  private storefront = 'us'; // Default to US, could be made configurable

  constructor() {
    // In production, you'd get this from your secure backend
    // For now, we'll use a placeholder that needs to be set
    this.developerToken = process.env.EXPO_PUBLIC_APPLE_MUSIC_TOKEN || null;
  }

  private getHeaders() {
    if (!this.developerToken) {
      throw new Error('Apple Music Developer Token not configured');
    }

    return {
      Authorization: `Bearer ${this.developerToken}`,
      'Content-Type': 'application/json',
    };
  }

  // Search for songs by query
  async searchSongs(
    query: string,
    limit: number = 5
  ): Promise<AppleMusicSong[]> {
    try {
      const url = `${this.baseUrl}/catalog/${
        this.storefront
      }/search?term=${encodeURIComponent(query)}&types=songs&limit=${limit}`;
      console.log('🔍 Apple Music Search Request:', url);

      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      console.log('🔍 Apple Music Search Response Status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 Apple Music Search Error Response:', errorText);
        throw new Error(
          `Apple Music API error: ${response.status} - ${errorText}`
        );
      }

      const data: { results: { songs?: AppleMusicApiResponse } } =
        await response.json();
      const firstSong = data.results.songs?.data?.[0];
      if (firstSong) {
        console.log(
          '🔍 Apple Music Search Results:',
          JSON.stringify(firstSong, null, 2)
        );
        console.log(
          '🖼️ Raw artwork object:',
          JSON.stringify(firstSong.attributes.artwork, null, 2)
        );
      }
      return data.results.songs?.data || [];
    } catch (error) {
      console.error('Error searching Apple Music:', error);
      throw error;
    }
  }

  // Get a specific song by ID
  async getSong(songId: string): Promise<AppleMusicSong | null> {
    try {
      const url = `${this.baseUrl}/catalog/${this.storefront}/songs/${songId}`;
      console.log('🎵 Apple Music API Request:', url);

      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      console.log('🎵 Apple Music API Response Status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🎵 Apple Music API Error Response:', errorText);
        throw new Error(
          `Apple Music API error: ${response.status} - ${errorText}`
        );
      }

      const data: AppleMusicApiResponse = await response.json();
      console.log('🎵 Apple Music API Data:', JSON.stringify(data, null, 2));
      return data.data[0] || null;
    } catch (error) {
      console.error('Error fetching Apple Music song:', error);
      throw error;
    }
  }

  // Get multiple songs by IDs
  async getSongs(songIds: string[]): Promise<AppleMusicSong[]> {
    try {
      const idsParam = songIds.join(',');
      const url = `${this.baseUrl}/catalog/${this.storefront}/songs?ids=${idsParam}`;

      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Apple Music API error: ${response.status}`);
      }

      const data: AppleMusicApiResponse = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching Apple Music songs:', error);
      throw error;
    }
  }

  // Check if service is configured
  isConfigured(): boolean {
    return !!this.developerToken;
  }
}

export const appleMusicApi = new AppleMusicApiService();

// Mock data for development/testing when API is not configured
export const mockAppleMusicData: AppleMusicSong = {
  id: '1440833098',
  type: 'songs',
  attributes: {
    name: 'Intergalactic',
    artistName: 'Beastie Boys',
    albumName: 'Hello Nasty',
    artwork: {
      url: '../assets/album-art/hello-nasty.jpg',
      width: 600,
      height: 600,
      bgColor: 'f4f4f4',
      textColor1: '000000',
      textColor2: '333333',
      textColor3: '666666',
      textColor4: '999999',
    },
    previews: [
      {
        url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/a2/5c/7e/a25c7e4b-b245-4c4e-9b9c-0b8c1b8e8b8e/mzaf_123456789.plus.aac.p.m4a',
      },
    ],
    durationInMillis: 210000,
    playParams: {
      id: '1440833098',
      kind: 'song',
    },
  },
};
