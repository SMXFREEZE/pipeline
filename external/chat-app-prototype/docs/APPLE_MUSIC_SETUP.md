# Apple Music Integration Setup

The app includes Apple Music integration for AI-powered music recommendations. When configured, the AI can respond with music suggestions that display as interactive Apple Music bubbles in the chat.

## Prerequisites

- Apple Developer Account
- Apple Music API Key (.p8 file)
- Node.js with `jsonwebtoken` package installed

## Setup Instructions

### 1. Configure Apple Music Credentials

Add the following to your `.env` file:

```bash
# Apple Music API Configuration
APPLE_MUSIC_KEY_ID=YOUR_KEY_ID        # e.g., 99C4QGLP3J
APPLE_MUSIC_TEAM_ID=YOUR_TEAM_ID      # Your 10-character Team ID from Apple Developer
APPLE_MUSIC_KEY_FILE=path/to/AuthKey_XXXXX.p8  # Path to your .p8 key file
```

**Where to find these values:**

- **Key ID**: Found in your Apple Developer account under Keys
- **Team ID**: Found in Apple Developer account under Membership
- **Key File**: The .p8 private key file downloaded from Apple Developer Portal

### 2. Generate Apple Music JWT Token

Run the token generation script:

```bash
npm run generate-apple-token
```

This will:

- Generate a JWT token valid for 6 months
- Automatically save it to your `.env` file as `EXPO_PUBLIC_APPLE_MUSIC_TOKEN`
- Display a success message with expiration date

### 3. Restart Development Server

```bash
# Stop the server (Ctrl+C) and restart
npm start
```

## How Music Integration Works

- When users mention music, songs, or artists in chat
- The AI detects music intent and generates appropriate responses
- Music suggestions appear as interactive Apple Music bubbles
- Users can tap to play songs directly in Apple Music

## Troubleshooting

- **Token expired**: Regenerate using `npm run generate-apple-token`
- **Invalid credentials**: Verify Team ID and Key ID in Apple Developer Portal
- **Missing .p8 file**: Ensure the file path in `.env` is correct

## Features

- **Music Detection**: AI automatically detects music-related messages
- **Apple Music Bubbles**: Interactive music cards with album art and play buttons
- **Deep Linking**: Direct integration with Apple Music app
- **Color Theming**: Dynamic colors extracted from album artwork
- **Vinyl Record View**: Special vinyl record bubble for enhanced music experience
