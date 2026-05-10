import { AIMessage, AIStructuredResponse } from '../types';
import { BaseAIProvider } from './base';
import { MOCK_RESPONSES, MOCK_CONFIG, RESPONSE_TYPES } from '../constants';

class MockService extends BaseAIProvider {
  constructor() {
    super('mock-key', 'Mock Service', 'Mock service error');
  }

  async generateStructuredResponse(
    messages: AIMessage[]
  ): Promise<AIStructuredResponse> {
    await this.simulateDelay();

    if (this.detectSpecialIntent(messages)) {
      const musicResponses = MOCK_RESPONSES.musicReactions;
      const randomIndex = Math.floor(Math.random() * musicResponses.length);

      return {
        type: RESPONSE_TYPES.MUSIC,
        content: musicResponses[randomIndex],
        musicQuery: this.getRandomMusicQuery(),
      };
    }

    return this.buildTextResponse(MOCK_RESPONSES.defaultText);
  }

  isConfigured(): boolean {
    return true; // Mock service is always configured
  }

  private async simulateDelay(): Promise<void> {
    const delay =
      MOCK_CONFIG.minDelay +
      Math.random() * (MOCK_CONFIG.maxDelay - MOCK_CONFIG.minDelay);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}

export default new MockService();
