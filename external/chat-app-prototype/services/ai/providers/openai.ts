import OpenAI from 'openai';
import { AIStructuredResponse } from '../types';
import { BaseAIProvider } from './base';
import {
  API_CONFIG,
  PROVIDER_CONFIG,
  ENV_KEYS,
  ERROR_MESSAGES,
} from '../constants';
import { createStructuredPrompt } from '../prompts';
import { AI_MODELS } from '../models';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

class OpenAIService extends BaseAIProvider {
  private client: OpenAI | null = null;

  constructor() {
    super(
      process.env[ENV_KEYS.openaiApiKey],
      'OpenAI',
      ERROR_MESSAGES.openaiNotConfigured
    );

    if (this.isConfigured()) {
      this.client = new OpenAI({ apiKey: this.apiKey });
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

      const systemMessage = {
        role: 'system' as const,
        content: structuredPrompt,
      };

      const response = await this.client!.chat.completions.create({
        model: AI_MODELS.openai.default,
        messages: [systemMessage, ...messages],
        max_tokens: API_CONFIG.maxTokens,
        temperature: API_CONFIG.temperature,
        presence_penalty: PROVIDER_CONFIG.openai.presencePenalty,
        frequency_penalty: PROVIDER_CONFIG.openai.frequencyPenalty,
      });

      const content = response.choices[0]?.message?.content || '';

      return this.parseStructuredResponse(content);
    } catch (error) {
      this.handleError(error, ERROR_MESSAGES.structuredResponseError);
    }
  }
}

export default new OpenAIService();
