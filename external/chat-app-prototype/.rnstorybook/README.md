# Storybook Component Library

This project includes Storybook for React Native to showcase and test components in isolation.

## Getting Started

### Running Storybook

```bash
# Start Storybook on web (recommended for development)
npm run storybook

# Run Storybook on iOS simulator
npm run storybook:ios
```

### Switching Between App and Storybook

- **Main App**: `npm start` or `npm run ios`
- **Storybook**: `npm run storybook` or `npm run storybook:ios`

## Available Components

### AppleMusicBubble

A component that displays music information in an iMessage-style bubble.

**Stories:**

- `HelloNasty` - Beastie Boys album as received message
- `WeezerBlueAlbum` - Weezer album as sent message (blue)
- `WithHeartReaction` - Music bubble with heart reaction
- `LoadingState` - Shows loading state
- `WithThumbsUp` - Sent message with thumbs up reaction
- `GroupMessage` - Message without tail (part of group)

**Interactive Controls:**

- Toggle `isSender` to switch between sent/received styles
- Toggle `hasReaction` to show/hide reactions
- Select `reactionType` to test different reactions
- Toggle `isLastInGroup` to show/hide message tail

## File Structure

```
.rnstorybook/
├── stories/
│   ├── AppleMusicBubble.stories.tsx    # Our custom component stories
│   ├── Button.stories.tsx              # Default Storybook examples
│   └── ...
├── main.ts                             # Storybook configuration
├── preview.tsx                         # Global decorators and parameters
└── storybook.requires.ts               # Auto-generated stories index
```

## Adding New Components

1. Create a `.stories.tsx` file in `.rnstorybook/stories/`
2. Follow the pattern from `AppleMusicBubble.stories.tsx`
3. Run `npm run storybook-generate` to update the stories index
4. Test with `npm run storybook`

## Development Tips

- Use the **Controls** panel to test different props interactively
- Use the dark background decorator to simulate the chat environment
- Stories automatically hot-reload during development
