# chat-app-prototype

[![CI](https://github.com/pdugan20/chat-app-prototype/actions/workflows/ci.yml/badge.svg)](https://github.com/pdugan20/chat-app-prototype/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/pdugan20/chat-app-prototype/branch/main/graph/badge.svg)](https://codecov.io/gh/pdugan20/chat-app-prototype)
[![Expo](https://img.shields.io/badge/Expo-SDK%2055-000020?logo=expo&logoColor=white)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React_Native-0.83-61DAFB?logo=react&logoColor=white)](https://reactnative.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?logo=opensourceinitiative&logoColor=white)](LICENSE)

A React Native recreation of Apple's iMessage. Pixel-perfect inbox and chat threads with reactions, timestamp grouping, group chats, and a native-style typing indicator. AI-generated replies via Claude or OpenAI, with Apple Music recommendations woven into chat. Includes Storybook for isolated component work.

## Getting Started

```bash
git clone https://github.com/pdugan20/chat-app-prototype
cd chat-app-prototype
npm install
npm run setup-hooks    # Git hooks for code quality
cp .env.example .env   # Configure API keys (optional)
npm run ios            # Build and run on iOS simulator
```

## Development

```bash
npm start              # Expo dev server
npm run ios            # Build and run on iOS
npm run lint           # ESLint
npm run format:check   # Prettier check
npm test               # Jest tests
npm run test:ci        # Tests with coverage
npm run sb:ios         # Storybook on iOS
```

## Architecture

```text
screens/          Chat and inbox screens
components/
  avatars/        Profile photo components
  bubbles/        Message bubble components
  chat/           Chat UI (input bar, typing indicator)
  inbox/          Inbox UI (chat items, search)
  navigation/     Navigation bar components
  previews/       Message preview components
hooks/            Custom React hooks
services/         AI and external service integrations
stores/           State management
constants/        Theme (colors, typography, spacing)
types/            TypeScript type definitions
data/             Mock data for development
```

## Documentation

- [AI Setup](docs/AI_SETUP.md) - Configure Claude or OpenAI responses
- [Apple Music Setup](docs/APPLE_MUSIC_SETUP.md) - Music integration
- [AI Flow](docs/AI_FLOW.md) - AI response decision logic
- [CI/CD Setup](docs/CI_CD_SETUP.md) - Pipeline configuration

## Related

- [chat-builder-plugin](https://github.com/pdugan20/chat-builder-plugin) - Figma plugin for generating iMessage prototypes
