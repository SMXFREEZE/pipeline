import type { Meta, StoryObj } from '@storybook/react-native';
import { fn } from 'storybook/test';
import React from 'react';
import AppleMusicBubble from '../../components/bubbles/AppleMusicBubble';
import { CenteredDecorator } from '../decorators';

// Extend the component props with story-specific controls
type AppleMusicBubbleStoryArgs = React.ComponentProps<
  typeof AppleMusicBubble
> & {
  darkMode?: boolean;
};

const meta: Meta<AppleMusicBubbleStoryArgs> = {
  title: 'Components/AppleMusicBubble',
  component: AppleMusicBubble,
  decorators: [
    CenteredDecorator,
    (Story, context) => {
      // Make reactionType ineffective when hasReaction is false
      if (!context.args.hasReaction) {
        context.args.reactionType = undefined;
      }
      return <Story />;
    },
  ],
  parameters: {
    actions: { argTypesRegex: '^on.*' },
  },
  argTypes: {
    songId: {
      control: 'text',
    },
    songTitle: {
      control: 'text',
    },
    artistName: {
      control: 'text',
    },
    duration: {
      table: { disable: true },
    },
    isSender: {
      control: 'boolean',
    },
    isLastInGroup: {
      control: 'boolean',
    },
    hasReaction: {
      control: 'boolean',
    },
    reactionType: {
      control: 'select',
      options: ['heart', 'thumbsUp', 'haha', 'doubleExclamation'],
    },
    useDynamicColors: {
      control: 'boolean',
      defaultValue: false,
      description: 'Use dynamic colors from Apple Music API',
    },
    colors: {
      table: { disable: true }, // Hide from controls, will use actual API colors
    },
    darkMode: {
      control: 'boolean',
      defaultValue: false,
      description: 'Toggle dark mode background for testing',
    },
  },
};

export default meta;
type Story = StoryObj<AppleMusicBubbleStoryArgs>;

// Beastie Boys - Intergalactic (Search Query)
export const Intergalactic: Story = {
  args: {
    songId: 'search:intergalactic beastie boys',
    songTitle: 'Intergalactic',
    artistName: 'Beastie Boys',
    isSender: false,
    hasReaction: false,
    isLastInGroup: true,
    darkMode: false,
    useDynamicColors: false,
    reactionType: 'thumbsUp',
    onPlay: fn(),
    onPause: fn(),
  },
  parameters: {
    notes: `
**Default AppleMusicBubble State**

This shows the basic AppleMusicBubble component as a received message (gray bubble) with:
- Real Apple Music API data fetched from search query
- Album art loaded from Apple Music
- Play button starts in red filled state (unplayed)
- Message tail shown (isLastInGroup: true)
- No reaction attached

**Interactions:**
- Tap play button to start/pause audio preview
- Play button changes to progress ring after first play
- Returns to red filled state after song completes
    `,
  },
};

// Weezer - Buddy Holly (Search Query)
export const BuddyHolly: Story = {
  args: {
    songId: 'search:buddy holly weezer',
    songTitle: 'Buddy Holly',
    artistName: 'Weezer',
    isSender: true,
    hasReaction: false,
    isLastInGroup: true,
    darkMode: false,
    useDynamicColors: false,
    reactionType: 'thumbsUp',
    onPlay: fn(),
    onPause: fn(),
  },
  parameters: {
    notes: `
**Sent Message Variant**

This shows the AppleMusicBubble as a sent message (blue bubble) demonstrating:
- isSender: true creates blue bubble with white text
- Album art placeholder uses white music note icon on blue background
- Play button and text colors adapt to blue background
- Message appears right-aligned as sender message
    `,
  },
};

// Radiohead - Paranoid Android (with thumbsUp reaction)
export const ParanoidAndroid: Story = {
  args: {
    songId: 'search:paranoid android radiohead',
    songTitle: 'Paranoid Android',
    artistName: 'Radiohead',
    isSender: false,
    hasReaction: true,
    isLastInGroup: true,
    darkMode: false,
    useDynamicColors: false,
    reactionType: 'thumbsUp',
    onPlay: fn(),
    onPause: fn(),
  },
  parameters: {
    notes: `
**Message with Reaction**

Demonstrates the AppleMusicBubble with a reaction attachment:
- hasReaction: true adds a thumbsUp reaction by default
- Reaction appears positioned above the message bubble
- Can be changed to other reaction types (heart, haha, doubleExclamation)
- Adds padding to bubble container to accommodate reaction
    `,
  },
};

// Kendrick Lamar - Not Like Us
export const NotLikeUs: Story = {
  args: {
    songId: 'search:not like us kendrick lamar',
    songTitle: 'Not Like Us',
    artistName: 'Kendrick Lamar',
    isSender: false,
    hasReaction: false,
    isLastInGroup: true,
    darkMode: false,
    useDynamicColors: false,
    reactionType: 'thumbsUp',
    onPlay: fn(),
    onPause: fn(),
  },
  parameters: {
    notes: `
**Kendrick Lamar - Not Like Us**

Contemporary hip-hop variant:
- Received message (gray bubble)
- Real Apple Music data fetched from search query
- Demonstrates album art + color extraction on modern release
    `,
  },
};

// Taylor Swift - Shake It Off (with heart reaction)
export const ShakeItOff: Story = {
  args: {
    songId: 'search:shake it off taylor swift',
    songTitle: 'Shake It Off',
    artistName: 'Taylor Swift',
    isSender: true,
    hasReaction: true,
    reactionType: 'heart',
    isLastInGroup: false,
    darkMode: false,
    useDynamicColors: false,
    onPlay: fn(),
    onPause: fn(),
  },
  parameters: {
    notes: `
**Sent Message with Heart Reaction**

Combines sender styling with different reaction type:
- Blue bubble (isSender: true) with heart reaction
- isLastInGroup: false removes message tail
- Shows how reactions work on sent messages
- Demonstrates different reaction types beyond thumbsUp
    `,
  },
};

// Nirvana - Smells Like Teen Spirit (grouped message, no tail)
export const SmellsLikeTeenSpirit: Story = {
  args: {
    songId: 'search:smells like teen spirit nirvana',
    songTitle: 'Smells Like Teen Spirit',
    artistName: 'Nirvana',
    isSender: false,
    hasReaction: false,
    isLastInGroup: false,
    darkMode: false,
    useDynamicColors: false,
    reactionType: 'thumbsUp',
    onPlay: fn(),
    onPause: fn(),
  },
  parameters: {
    notes: `
**Group Message (No Tail)**

Shows the bubble as part of a message group:
- isLastInGroup: false removes the message tail
- Used when multiple messages from same sender are grouped together
- Creates cleaner visual flow for consecutive messages
- Tail only appears on the final message in a group

**Dynamic Colors Toggle:**
- Use the controls panel to toggle useDynamicColors
- When enabled, uses dynamic colors extracted from album artwork by the Apple Music API
- Colors automatically adapt to match each song's album art
    `,
  },
};
