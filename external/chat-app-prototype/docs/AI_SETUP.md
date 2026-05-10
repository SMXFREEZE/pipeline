# AI Integration Setup

The app supports AI-powered contextual responses using either Anthropic's Claude or OpenAI's GPT models. When enabled, the AI will automatically respond to your messages with natural, conversational replies.

## Setup Instructions

### 1. Get an API Key

**For Anthropic (Claude):**

- Sign up at <https://console.anthropic.com/>
- Navigate to API Keys section
- Create a new API key
- Copy the key (starts with `sk-ant-`)

**For OpenAI (GPT):**

- Sign up at <https://platform.openai.com/>
- Navigate to API Keys section
- Create a new API key
- Copy the key (starts with `sk-`)

### 2. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit the .env file and add your configuration:

# For Anthropic:
EXPO_PUBLIC_AI_PROVIDER=anthropic
EXPO_PUBLIC_ANTHROPIC_API_KEY=sk-ant-your-key-here

# For OpenAI:
EXPO_PUBLIC_AI_PROVIDER=openai
EXPO_PUBLIC_OPENAI_API_KEY=sk-your-key-here
```

### 3. Restart the App

```bash
# Stop the server (Ctrl+C) and restart
npm start
```

## How It Works

- Send a message in any chat
- The typing indicator appears while the AI processes
- A contextual response is generated based on the conversation
- Falls back to preset responses if API is unavailable

## Features

- **Contextual Responses**: Based on last 10 messages for context
- **Music Detection**: AI can detect music mentions and respond with Apple Music bubbles
- **Error Handling**: Graceful fallback to preset responses if API fails
- **Provider Flexibility**: Easy switching between Anthropic and OpenAI

For more details on AI response flow, see [AI_FLOW.md](./AI_FLOW.md).
