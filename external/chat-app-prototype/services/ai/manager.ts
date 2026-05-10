import { AIService, AIMessage, AIStructuredResponse } from './types';
import anthropicService from './providers/anthropic';
import openaiService from './providers/openai';
import mockService from './providers/mock';
import {
  PROVIDER_NAMES,
  ENV_KEYS,
  WARNING_MESSAGES,
  ERROR_MESSAGES,
  MOCK_RESPONSES,
  RESPONSE_TYPES,
} from './constants';

class AIServiceManager implements AIService {
  private service: AIService;

  constructor() {
    const aiProvider =
      process.env[ENV_KEYS.provider] || PROVIDER_NAMES.ANTHROPIC;

    // Initialize based on provider
    switch (aiProvider) {
      case PROVIDER_NAMES.ANTHROPIC:
        this.service = anthropicService.isConfigured()
          ? anthropicService
          : mockService;
        break;
      case PROVIDER_NAMES.OPENAI:
        this.service = openaiService.isConfigured()
          ? openaiService
          : mockService;
        break;
      default:
        this.service = mockService;
    }
  }

  async generateStructuredResponse(
    messages: AIMessage[],
    contactName?: string
  ): Promise<AIStructuredResponse> {
    if (!this.service.isConfigured()) {
      console.warn(WARNING_MESSAGES.serviceNotConfigured);
      return {
        type: RESPONSE_TYPES.TEXT,
        content: this.getFallbackResponse(),
      };
    }

    try {
      return await this.service.generateStructuredResponse(
        messages,
        contactName
      );
    } catch (error) {
      console.error(ERROR_MESSAGES.structuredResponseError, error);
      return {
        type: RESPONSE_TYPES.TEXT,
        content: this.getFallbackResponse(),
      };
    }
  }

  private getFallbackResponse(): string {
    const responses = MOCK_RESPONSES.fallback;
    return responses[Math.floor(Math.random() * responses.length)];
  }

  isConfigured(): boolean {
    return this.service.isConfigured();
  }

  getCurrentProvider(): string {
    return process.env[ENV_KEYS.provider] || PROVIDER_NAMES.ANTHROPIC;
  }

  // Song tracking methods - pass through to underlying service
  addMentionedSong(songQuery: string): void {
    if (this.service.addMentionedSong) {
      this.service.addMentionedSong(songQuery);
    }
  }

  getMentionedSongs(): string[] {
    if (this.service.getMentionedSongs) {
      return this.service.getMentionedSongs();
    }
    return [];
  }

  resetMentionedSongs(): void {
    if (this.service.resetMentionedSongs) {
      this.service.resetMentionedSongs();
    }
  }
}

export default new AIServiceManager();
