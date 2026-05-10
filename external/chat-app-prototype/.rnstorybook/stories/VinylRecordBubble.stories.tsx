import type { Meta, StoryObj } from '@storybook/react-native';
import React from 'react';
import VinylRecordBubble from '../../components/bubbles/VinylRecordBubble';
import { CenteredDecorator } from '../decorators';
import { VinylRecordMessage } from '../../types/message';

// Extend the component props with story-specific controls
type VinylRecordBubbleStoryArgs = {
  // VinylRecordMessage properties exposed as individual controls
  songId: string;
  songTitle?: string;
  artistName?: string;
  albumArtUrl?: string;
  previewUrl?: string;
  duration?: number;
  appleMusicId?: string;
  // Base message properties
  isSender: boolean;
  hasReaction?: boolean;
  reactionType?: 'heart' | 'thumbsUp' | 'haha' | 'doubleExclamation';
  // Story-specific controls
  useDynamicColors?: boolean;
  colors?: {
    bgColor?: string;
    textColor1?: string;
    textColor2?: string;
    textColor3?: string;
    textColor4?: string;
  };
  darkMode?: boolean;
};

const meta: Meta<VinylRecordBubbleStoryArgs> = {
  title: 'Components/VinylRecordBubble',
  // Don't assign component directly since args don't match props
  decorators: [
    (Story, context) => {
      // Build the message object from individual controls
      const message: VinylRecordMessage = {
        id: 'vinyl-story',
        type: 'vinylRecord',
        text: context.args.songTitle || '',
        songId: context.args.songId,
        songTitle: context.args.songTitle,
        artistName: context.args.artistName,
        albumArtUrl: context.args.albumArtUrl,
        previewUrl: context.args.previewUrl,
        duration: context.args.duration,
        appleMusicId: context.args.appleMusicId,
        isSender: context.args.isSender,
        timestamp: new Date().toISOString(),
        hasReaction: context.args.hasReaction,
        reactionType: context.args.hasReaction
          ? context.args.reactionType
          : undefined,
        useDynamicColors: context.args.useDynamicColors,
        colors: context.args.colors,
      };

      // Make reactionType ineffective when hasReaction is false
      if (!context.args.hasReaction) {
        message.reactionType = undefined;
      }

      // Apply CenteredDecorator with the correct args
      const wrappedArgs = { message, darkMode: context.args.darkMode };
      return CenteredDecorator(() => <VinylRecordBubble message={message} />, {
        ...context,
        args: wrappedArgs,
      });
    },
  ],
  parameters: {
    actions: { argTypesRegex: '^on.*' },
  },
  argTypes: {
    songId: {
      control: 'text',
      description:
        'Song identifier or search query (e.g. "search:song title artist")',
    },
    songTitle: {
      control: 'text',
      description: 'Song title to display',
    },
    artistName: {
      control: 'text',
      description: 'Artist name to display',
    },
    albumArtUrl: {
      control: 'text',
      description: 'Direct URL to album artwork image',
    },
    previewUrl: {
      control: 'text',
      description: 'URL to audio preview file',
    },
    duration: {
      table: { disable: true },
      description: 'Duration in seconds (auto-detected from API)',
    },
    appleMusicId: {
      table: { disable: true },
      description: 'Apple Music track ID (auto-detected from API)',
    },
    isSender: {
      control: 'boolean',
      description: 'Whether this is a sent message (blue) or received (gray)',
    },
    hasReaction: {
      control: 'boolean',
      description: 'Whether message has a reaction emoji',
    },
    reactionType: {
      control: 'select',
      options: ['heart', 'thumbsUp', 'haha', 'doubleExclamation'],
      description:
        'Type of reaction emoji (only visible when hasReaction is true)',
    },
    useDynamicColors: {
      control: 'boolean',
      description: 'Use dynamic colors extracted from album artwork',
    },
    colors: {
      table: { disable: true },
      description: 'Custom color overrides (advanced)',
    },
    darkMode: {
      control: 'boolean',
      description: 'Toggle dark mode background for testing',
    },
  },
};

export default meta;
type Story = StoryObj<VinylRecordBubbleStoryArgs>;

// Olivia Rodrigo - Love is Embarrassing
export const LoveIsEmbarrassing: Story = {
  args: {
    songId: 'search:love is embarrassing olivia rodrigo',
    songTitle: 'love is embarrassing',
    artistName: 'Olivia Rodrigo',
    isSender: false,
    hasReaction: false,
    reactionType: 'heart',
    useDynamicColors: true,
    darkMode: false,
  },
  parameters: {
    notes: `
**Olivia Rodrigo - Love is Embarrassing**

This shows the VinylRecordBubble component as a received message with:
- Real Apple Music API data fetched from search query
- Album art displayed as vinyl record label
- Spinning animation when playing
- Scrubbing capability by dragging the vinyl
- Dynamic colors from album artwork
- Smooth progress animation on play button

**Interactions:**
- Tap play button to start/pause audio preview
- Drag vinyl record to scrub through the song
- Progress ring animates smoothly during playback
- Vinyl spins at 33⅓ RPM when playing
    `,
  },
};

// The Beatles - Hey Jude (Classic Vinyl)
export const HeyJude: Story = {
  args: {
    songId: 'search:hey jude beatles',
    songTitle: 'Hey Jude',
    artistName: 'The Beatles',
    isSender: true,
    hasReaction: false,
    reactionType: 'heart',
    useDynamicColors: true,
    darkMode: false,
  },
  parameters: {
    notes: `
**The Beatles - Classic Vinyl (Sent)**

Shows the VinylRecordBubble as a sent message (blue bubble) demonstrating:
- isSender: true creates blue bubble variant
- Classic vinyl aesthetic with The Beatles
- Album art from Apple Music API
- Text colors adapt to blue background
- Message appears right-aligned as sender message
    `,
  },
};

// Pink Floyd - Wish You Were Here
export const WishYouWereHere: Story = {
  args: {
    songId: 'search:wish you were here pink floyd',
    songTitle: 'Wish You Were Here',
    artistName: 'Pink Floyd',
    isSender: false,
    hasReaction: true,
    reactionType: 'heart',
    useDynamicColors: true,
    darkMode: false,
  },
  parameters: {
    notes: `
**Pink Floyd with Heart Reaction**

Demonstrates the VinylRecordBubble with a reaction attachment:
- hasReaction: true adds a heart reaction
- Classic prog rock vinyl aesthetic
- Dynamic colors from album artwork
- Shows how reactions work with vinyl bubbles
    `,
  },
};

// Fleetwood Mac - Dreams
export const Dreams: Story = {
  args: {
    songId: 'search:dreams fleetwood mac',
    songTitle: 'Dreams',
    artistName: 'Fleetwood Mac',
    isSender: true,
    hasReaction: true,
    reactionType: 'thumbsUp',
    useDynamicColors: true,
    darkMode: false,
  },
  parameters: {
    notes: `
**Fleetwood Mac - Sent with Reaction**

Combines sender styling with reaction:
- Blue bubble (isSender: true) with thumbsUp reaction
- Classic 70s rock vinyl
- Dynamic colors adapt to Rumours album art
- Demonstrates different reaction types
    `,
  },
};

// Daft Punk - Get Lucky
export const GetLucky: Story = {
  args: {
    songId: 'search:get lucky daft punk',
    songTitle: 'Get Lucky',
    artistName: 'Daft Punk',
    isSender: false,
    hasReaction: false,
    reactionType: 'heart',
    useDynamicColors: true,
    darkMode: true,
  },
  parameters: {
    notes: `
**Daft Punk - Modern Electronic**

Shows vinyl bubble with modern electronic music:
- Dynamic colors from Random Access Memories album
- Dark mode enabled for testing
- Electronic music on vinyl aesthetic
- Demonstrates genre versatility of the component
    `,
  },
};

// Taylor Swift - Anti-Hero
export const AntiHero: Story = {
  args: {
    songId: 'search:anti hero taylor swift',
    songTitle: 'Anti-Hero',
    artistName: 'Taylor Swift',
    isSender: false,
    hasReaction: true,
    reactionType: 'haha',
    useDynamicColors: true,
    darkMode: false,
  },
  parameters: {
    notes: `
**Taylor Swift - Modern Pop Vinyl**

Contemporary pop on vinyl format:
- Midnights album artwork as vinyl label
- Haha reaction demonstrates humor response
- Dynamic purple/blue colors from album
- Shows modern music in classic format
    `,
  },
};
