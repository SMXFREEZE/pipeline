import Anthropic from '@anthropic-ai/sdk';
import { AIStructuredResponse } from '../types';
import { BaseAIProvider } from './base';
import { API_CONFIG, ENV_KEYS, ERROR_MESSAGES } from '../constants';
import { createStructuredPrompt } from '../prompts';
import { AI_MODELS } from '../models';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

class AnthropicService extends BaseAIProvider {
  private client: Anthropic | null = null;

  constructor() {
    super(
      process.env[ENV_KEYS.anthropicApiKey],
      'Anthropic',
      ERROR_MESSAGES.anthropicNotConfigured
    );

    if (this.isConfigured()) {
      this.client = new Anthropic({ apiKey: this.apiKey });
    }
  }

  async generateStructuredResponse(
    messages: ChatMessage[],
    contactName: string = 'Friend'
  ): Promise<AIStructuredResponse> {
    this.validateConfiguration();

    try {
      const mentionedSongsList = this.getMentionedSongs();
      const structuredPrompt = createStructuredPrompt(
        contactName,
        mentionedSongsList
      );

      const response = await this.client!.messages.create({
        model: AI_MODELS.anthropic.default,
        max_tokens: API_CONFIG.maxTokens,
        temperature: API_CONFIG.temperature,
        system: structuredPrompt,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
      });

      const content =
        response.content[0]?.type === 'text' ? response.content[0].text : '';

      return this.parseStructuredResponse(content);
    } catch (error) {
      this.handleError(error, ERROR_MESSAGES.structuredResponseError);
    }
  }
}

export default new AnthropicService();
