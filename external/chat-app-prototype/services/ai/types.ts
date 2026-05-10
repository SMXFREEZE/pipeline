export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIStructuredResponse {
  type: 'text' | 'music';
  content: string;
  musicQuery?: string; // For music responses
}

export interface AIService {
  generateStructuredResponse(
    messages: AIMessage[],
    contactName?: string
  ): Promise<AIStructuredResponse>;
  isConfigured(): boolean;
  // Song tracking methods (optional for non-anthropic services)
  addMentionedSong?(songQuery: string): void;
  getMentionedSongs?(): string[];
  resetMentionedSongs?(): void;
}
