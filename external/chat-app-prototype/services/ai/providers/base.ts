import { AIService, AIMessage, AIStructuredResponse } from '../types';
import {
  API_CONFIG,
  MUSIC_KEYWORDS,
  MOCK_MUSIC_QUERIES,
  RESPONSE_TYPES,
  LOG_MESSAGES,
  MUSIC_RESPONSE_FORMATS,
  MOCK_RESPONSES,
} from '../constants';
import { BUBBLE_TYPES } from '../bubbleTypes';
import { cleanAIResponseArtifacts } from '../utils';

// Track mentioned songs to prevent repetition
let mentionedSongs = new Set<string>();

export abstract class BaseAIProvider implements AIService {
  protected apiKey: string | undefined;
  protected serviceName: string;
  protected errorMessage: string;

  constructor(
    apiKey: string | undefined,
    serviceName: string,
    errorMessage: string
  ) {
    this.apiKey = apiKey?.trim();
    this.serviceName = serviceName;
    this.errorMessage = errorMessage;
  }

  abstract generateStructuredResponse(
    messages: AIMessage[],
    contactName?: string
  ): Promise<AIStructuredResponse>;

  // Song tracking methods - shared implementation
  addMentionedSong(songQuery: string): void {
    mentionedSongs.add(songQuery.toLowerCase().trim());
  }

  getMentionedSongs(): string[] {
    return Array.from(mentionedSongs);
  }

  resetMentionedSongs(): void {
    mentionedSongs.clear();
    console.log(LOG_MESSAGES.clearedMentionedSongs);
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  protected validateConfiguration(): void {
    if (!this.isConfigured()) {
      throw new Error(this.errorMessage);
    }
  }

  protected handleError(error: any, errorType: string): never {
    console.error(errorType, error);
    throw error;
  }

  protected getDefaultFallback(): string {
    return API_CONFIG.defaultFallback;
  }

  protected detectSpecialIntent(messages: AIMessage[]): boolean {
    const lastMessage =
      messages[messages.length - 1]?.content.toLowerCase() || '';
    // Currently only detecting music, but can be extended for other intents
    return MUSIC_KEYWORDS.some(keyword => lastMessage.includes(keyword));
  }

  protected getRandomMusicQuery(): string {
    const queries = MOCK_MUSIC_QUERIES;
    return queries[Math.floor(Math.random() * queries.length)];
  }

  protected buildSpecialResponse(type: 'music'): AIStructuredResponse {
    // Can be extended to handle different special response types
    if (type === 'music') {
      return {
        type: RESPONSE_TYPES.MUSIC,
        content: "Here's a song you might like!",
        musicQuery: this.getRandomMusicQuery(),
      };
    }
    // Default fallback for unknown types
    return this.buildTextResponse("I'll help you with that!");
  }

  protected buildTextResponse(content: string): AIStructuredResponse {
    return {
      type: RESPONSE_TYPES.TEXT,
      content,
    };
  }

  // Universal response parser for all bubble types
  protected parseStructuredResponse(content: string): AIStructuredResponse {
    // Check each bubble type for a match
    for (const [key, config] of Object.entries(BUBBLE_TYPES)) {
      if (content.includes(config.formatKey)) {
        // Found a matching format, parse it
        if (key === 'MUSIC') {
          return this.parseMusicResponse(content);
        }
        // Add more special parsers here as needed:
        // if (key === 'LOCATION') return this.parseLocationResponse(content);

        // Default parsing for simple bubble types
        return this.parseGenericResponse(content, config);
      }
    }

    // No format found, treat as text
    let messageContent = cleanAIResponseArtifacts(content.trim());
    if (!messageContent) {
      messageContent = MOCK_RESPONSES.defaultText || "That's interesting!";
    }
    return this.buildTextResponse(messageContent);
  }

  protected parseGenericResponse(
    content: string,
    config: any
  ): AIStructuredResponse {
    const lines = content.split('\n').filter(line => line.trim());
    const formatIndex = lines.findIndex(
      line => line.trim() === config.formatKey
    );

    if (formatIndex !== -1 && formatIndex < lines.length - 1) {
      const messageContent = lines[formatIndex + 1] || '';
      return {
        type: config.type.toUpperCase(),
        content: messageContent,
      };
    }

    // Fallback to text
    return this.buildTextResponse(content);
  }

  protected parseMusicResponse(content: string): AIStructuredResponse {
    const lines = content.split('\n').filter(line => line.trim());
    const musicResponseIndex = lines.findIndex(
      line => line.trim() === BUBBLE_TYPES.MUSIC.formatKey
    );

    const messageContent =
      lines[musicResponseIndex + 1] ||
      MOCK_RESPONSES.defaultMusic ||
      "Here's a song!";

    const musicQueryLine = lines.find(line =>
      line.startsWith(MUSIC_RESPONSE_FORMATS.queryPrefix)
    );
    const musicQuery = musicQueryLine
      ? musicQueryLine.replace(MUSIC_RESPONSE_FORMATS.queryPrefix, '').trim()
      : this.getRandomMusicQuery();

    this.addMentionedSong(musicQuery);

    return {
      type: RESPONSE_TYPES.MUSIC,
      content: messageContent,
      musicQuery: musicQuery,
    };
  }
}
