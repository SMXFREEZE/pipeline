export const AI_MODELS = {
  anthropic: {
    default: 'claude-sonnet-4-6',
    models: {
      'claude-haiku-4-5-20251001': {
        name: 'Claude 4.5 Haiku',
        description: 'Fastest, most affordable',
      },
      'claude-sonnet-4-6': {
        name: 'Claude 4.6 Sonnet',
        description: 'Best balance of speed and intelligence',
      },
      'claude-opus-4-6': {
        name: 'Claude 4.6 Opus',
        description: 'Most intelligent for complex tasks',
      },
    },
  },
  openai: {
    default: 'gpt-4o',
    models: {
      'gpt-4o-mini': {
        name: 'GPT-4o Mini',
        description: 'Fastest, most cost-efficient version',
      },
      'gpt-4o': {
        name: 'GPT-4o',
        description: 'Best balance of speed and capability',
      },
      'gpt-4-turbo': {
        name: 'GPT-4 Turbo',
        description: 'Most capable for complex tasks',
      },
    },
  },
} as const;
