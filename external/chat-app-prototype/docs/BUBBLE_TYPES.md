# Bubble Types System

## Overview

The bubble types system provides an extensible way to add new special response types (like music, location, photos, etc.) to the AI chat functionality. Instead of hardcoding each response type, the system uses a configuration-based approach that automatically generates prompts and handles parsing.

## Architecture

### Core Components

1. **`services/ai/bubbleTypes.ts`** - Central configuration file
2. **`services/ai/prompts-v2.ts`** - Dynamic prompt generation
3. **`services/ai/providers/base.ts`** - Universal response parsing
4. **Provider implementations** - Anthropic and OpenAI use the same system

### How It Works

```text
User Message → AI Provider → Structured Prompt (generated from configs)
→ AI Response → Universal Parser → Typed Response
```

## Adding a New Bubble Type

### Step 1: Define the Bubble Type

Edit `services/ai/bubbleTypes.ts` and add your new type to `BUBBLE_TYPES`:

```typescript
LOCATION: {
  type: 'location',
  formatKey: 'LOCATION_RESPONSE',
  triggers: [
    'where are you',
    'send.*location',
    'share.*location',
    'what.*address',
  ],
  negativeContext: [
    'location in the code',
    'memory location'
  ],
  responseFormat: '[Location name or description]\nLOCATION_DATA:[coordinates or address]',
  examples: [
    {
      trigger: 'Where are you?',
      response: 'At the coffee shop!\nLOCATION_DATA:37.7749,-122.4194',
    },
  ],
}
```

### Step 2: Add Response Type Constant

In `services/ai/constants.ts`, add to `RESPONSE_TYPES`:

```typescript
export const RESPONSE_TYPES = {
  TEXT: 'text',
  MUSIC: 'music',
  LOCATION: 'location', // Add this
} as const;
```

### Step 3: Add Custom Parser (if needed)

For complex bubble types that need special parsing, add a method in `services/ai/providers/base.ts`:

```typescript
protected parseLocationResponse(content: string): AIStructuredResponse {
  const lines = content.split('\n').filter(line => line.trim());
  const locationIndex = lines.findIndex(
    line => line.trim() === 'LOCATION_RESPONSE'
  );

  const locationName = lines[locationIndex + 1] || 'Current location';
  const dataLine = lines.find(line => line.startsWith('LOCATION_DATA:'));
  const coordinates = dataLine
    ? dataLine.replace('LOCATION_DATA:', '').trim()
    : null;

  return {
    type: RESPONSE_TYPES.LOCATION,
    content: locationName,
    locationData: coordinates,
  };
}
```

Then update the `parseStructuredResponse` method to use it:

```typescript
if (key === 'LOCATION') {
  return this.parseLocationResponse(content);
}
```

### Step 4: Update TypeScript Types

In `services/ai/types.ts`, extend the response type:

```typescript
export interface AIStructuredResponse {
  type: string;
  content: string;
  musicQuery?: string;
  locationData?: string; // Add for location type
  // Add other fields as needed
}
```

## Configuration Options

Each bubble type configuration has the following properties:

| Property          | Type      | Description                                            |
| ----------------- | --------- | ------------------------------------------------------ |
| `type`            | string    | The response type identifier                           |
| `formatKey`       | string    | The format header the AI uses (e.g., "MUSIC_RESPONSE") |
| `triggers`        | string[]  | Regex patterns that trigger this response type         |
| `negativeContext` | string[]  | Phrases that prevent this type from triggering         |
| `responseFormat`  | string    | The expected format of the AI response                 |
| `examples`        | Example[] | Examples to train the AI                               |
| `parser?`         | function  | Optional custom parser function                        |

## How the System Works

### 1. Prompt Generation

The `createStructuredPromptV2` function:

- Iterates through all bubble types
- Builds trigger rules dynamically
- Includes examples from each type
- Creates a comprehensive prompt for the AI

### 2. Response Detection

When the AI responds:

1. The response includes a format header (e.g., `MUSIC_RESPONSE`)
2. The parser checks for known format headers
3. Routes to the appropriate parser (custom or generic)
4. Returns a typed response object

### 3. Extensibility

The system is designed to be extended without modifying core logic:

- Add new types to the configuration
- System automatically includes them in prompts
- Generic parser handles simple types
- Custom parsers can be added for complex types

## Examples of Bubble Types

### Currently Implemented

**Music** - Shares songs via Apple Music

```typescript
type: 'music'
triggers: ['play a song', 'send me music', 'favorite song']
response: { type: 'MUSIC', content: 'Love this one!', musicQuery: 'anti hero taylor swift' }
```

### Potential Future Types

**Location** - Share current location

```typescript
type: 'location'
triggers: ['where are you', 'send location']
response: { type: 'LOCATION', content: 'Coffee shop', locationData: '37.7749,-122.4194' }
```

**Photo** - Share images

```typescript
type: 'photo'
triggers: ['show me a photo', 'send a picture']
response: { type: 'PHOTO', content: 'Check this out!', photoUrl: 'https://...' }
```

**Payment** - Apple Pay requests

```typescript
type: 'payment'
triggers: ['send me money', 'request payment']
response: { type: 'PAYMENT', content: 'For lunch', amount: 12.50 }
```

**Game** - GamePigeon invitations

```typescript
type: 'game'
triggers: ['play a game', 'start game pigeon']
response: { type: 'GAME', content: "Let's play!", gameType: 'chess' }
```

## Testing New Bubble Types

1. Add the configuration to `bubbleTypes.ts`
2. Test with both AI providers:

   ```bash
   # Test with Anthropic
   EXPO_PUBLIC_AI_PROVIDER=anthropic npm run ios

   # Test with OpenAI
   EXPO_PUBLIC_AI_PROVIDER=openai npm run ios
   ```

3. Send messages that should trigger the new type
4. Verify the response format and parsing

## Troubleshooting

### AI Not Using New Format

- Check that `formatKey` is unique
- Ensure examples clearly demonstrate the format
- Verify triggers aren't too broad or conflicting

### Parser Not Working

- Check format header matches exactly
- Verify line splitting logic handles your format
- Test with debug logging in `parseStructuredResponse`

### Type Not Triggering

- Review trigger patterns (they use regex)
- Check negative context isn't blocking valid requests
- Test trigger patterns with regex tools

## Best Practices

1. **Keep triggers specific** - Avoid overly broad patterns
2. **Use negative context** - Prevent false positives
3. **Provide clear examples** - AI learns from these
4. **Test both providers** - OpenAI and Anthropic may behave differently
5. **Start simple** - Use generic parser before writing custom ones
6. **Document formats** - Clear format specifications help debugging
