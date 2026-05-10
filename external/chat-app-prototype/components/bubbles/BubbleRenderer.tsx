import React from 'react';
import MessageBubble from './MessageBubble';
import { Message } from '../../types/message';
import { getBubbleComponent } from '../../config/bubbleRegistry';

interface BubbleRendererProps {
  message: Message;
  isLastInGroup: boolean;
  isFirstInGroup: boolean;
  hasReaction: boolean;
}

const BubbleRenderer: React.FC<BubbleRendererProps> = ({
  message,
  isLastInGroup,
  isFirstInGroup: _isFirstInGroup,
  hasReaction,
}) => {
  const bubbleConfig = getBubbleComponent(message.type);

  if (!bubbleConfig) {
    // Fallback to text bubble for unknown types
    return (
      <MessageBubble
        text={'Unsupported message type'}
        isSender={message.isSender}
        hasReaction={hasReaction}
        reactionType={message.reactionType}
        isLastInGroup={isLastInGroup}
      />
    );
  }

  const { component: BubbleComponent, extractProps } = bubbleConfig;

  // Extract message-specific props
  const messageProps = extractProps(message);

  // Combine with common bubble props
  const bubbleProps = {
    ...messageProps,
    isSender: message.isSender,
    hasReaction,
    reactionType: message.reactionType,
    isLastInGroup,
  };

  return <BubbleComponent {...bubbleProps} />;
};

export default BubbleRenderer;
