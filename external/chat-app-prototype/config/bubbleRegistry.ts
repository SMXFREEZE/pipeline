import { ComponentType } from 'react';
import { MessageType } from '../types/message';
import MessageBubble from '../components/bubbles/MessageBubble';
import AppleMusicBubble from '../components/bubbles/AppleMusicBubble';
import VinylRecordBubble from '../components/bubbles/VinylRecordBubble';

// Registry type
type BubbleRegistry = {
  [K in MessageType]?: {
    component: ComponentType<any>;
    extractProps: (message: any) => any;
  };
};

// Bubble component registry
const bubbleRegistry: BubbleRegistry = {
  text: {
    component: MessageBubble,
    extractProps: message => ({
      text: message.text,
      _isFirstInGroup: true, // This will be passed from BubbleRenderer
    }),
  },
  appleMusic: {
    component: AppleMusicBubble,
    extractProps: message => ({
      songId: message.songId,
      songTitle: message.songTitle,
      artistName: message.artistName,
      albumArtUrl: message.albumArtUrl,
      previewUrl: message.previewUrl,
      duration: message.duration,
      appleMusicId: message.appleMusicId,
      playParams: message.playParams,
      colors: message.colors,
      caption: message.caption,
      useDynamicColors: true,
    }),
  },
  vinylRecord: {
    component: VinylRecordBubble,
    extractProps: message => ({
      message: message,
    }),
  },
  // Future bubble types can be added here
  // image: {
  //   component: ImageBubble,
  //   extractProps: (message) => ({
  //     imageUrl: message.imageUrl,
  //     thumbnailUrl: message.thumbnailUrl,
  //     width: message.width,
  //     height: message.height,
  //   }),
  // },
};

// Function to get bubble component and props
export function getBubbleComponent(type: MessageType) {
  return bubbleRegistry[type] || bubbleRegistry.text;
}
