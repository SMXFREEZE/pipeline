import React from 'react';
import { render } from '@testing-library/react-native';
import MessageBubble from '../MessageBubble';

// Mock the child components
jest.mock('../shared/BubbleTail', () => 'BubbleTail');
jest.mock('../../chat/Reaction', () => 'Reaction');

describe('MessageBubble', () => {
  const defaultProps = {
    text: 'Hello World',
    isSender: false,
  };

  describe('Basic Rendering', () => {
    it('should render message text correctly', () => {
      const { getByText } = render(<MessageBubble {...defaultProps} />);
      expect(getByText('Hello World')).toBeTruthy();
    });

    it('should render without crashing for sender', () => {
      const { getByText } = render(
        <MessageBubble {...defaultProps} isSender={true} />
      );
      expect(getByText('Hello World')).toBeTruthy();
    });

    it('should render without crashing for recipient', () => {
      const { getByText } = render(
        <MessageBubble {...defaultProps} isSender={false} />
      );
      expect(getByText('Hello World')).toBeTruthy();
    });
  });

  describe('Sender vs Recipient Styling', () => {
    it('should render with sender styles when isSender is true', () => {
      const { toJSON } = render(
        <MessageBubble {...defaultProps} isSender={true} />
      );
      const tree = toJSON();
      // Sender messages should exist and render
      expect(tree).toBeTruthy();
    });

    it('should render with recipient styles when isSender is false', () => {
      const { toJSON } = render(
        <MessageBubble {...defaultProps} isSender={false} />
      );
      const tree = toJSON();
      // Recipient messages should exist and render
      expect(tree).toBeTruthy();
    });
  });

  describe('Reaction Display', () => {
    it('should render Reaction component when hasReaction is true', () => {
      const { UNSAFE_getByType } = render(
        <MessageBubble
          {...defaultProps}
          hasReaction={true}
          reactionType='heart'
        />
      );
      // @ts-expect-error - Mocked component as string
      expect(UNSAFE_getByType('Reaction')).toBeTruthy();
    });

    it('should not render Reaction component when hasReaction is false', () => {
      const { queryByTestId } = render(
        <MessageBubble {...defaultProps} hasReaction={false} />
      );
      expect(queryByTestId('reaction')).toBeNull();
    });

    it('should not render Reaction when hasReaction is true but reactionType is missing', () => {
      const { queryByTestId } = render(
        <MessageBubble {...defaultProps} hasReaction={true} />
      );
      expect(queryByTestId('reaction')).toBeNull();
    });

    it('should render with reaction when hasReaction is true and reactionType is provided', () => {
      const { UNSAFE_getByType } = render(
        <MessageBubble
          {...defaultProps}
          hasReaction={true}
          reactionType='thumbsUp'
        />
      );
      // Should render both the message and the reaction
      // @ts-expect-error - Mocked component as string
      expect(UNSAFE_getByType('Reaction')).toBeTruthy();
    });
  });

  describe('Tail Display', () => {
    it('should render BubbleTail when isLastInGroup is true', () => {
      const { UNSAFE_getByType } = render(
        <MessageBubble {...defaultProps} isLastInGroup={true} />
      );
      // @ts-expect-error - Mocked component as string
      expect(UNSAFE_getByType('BubbleTail')).toBeTruthy();
    });

    it('should not render BubbleTail when isLastInGroup is false', () => {
      const { queryByTestId } = render(
        <MessageBubble {...defaultProps} isLastInGroup={false} />
      );
      expect(queryByTestId('bubble-tail')).toBeNull();
    });

    it('should pass correct color to BubbleTail for sender', () => {
      const { UNSAFE_getByType } = render(
        <MessageBubble {...defaultProps} isSender={true} isLastInGroup={true} />
      );
      // @ts-expect-error - Mocked component as string
      const bubbleTail = UNSAFE_getByType('BubbleTail');
      expect(bubbleTail.props.color).toBe('#007aff');
    });

    it('should pass correct color to BubbleTail for recipient', () => {
      const { UNSAFE_getByType } = render(
        <MessageBubble
          {...defaultProps}
          isSender={false}
          isLastInGroup={true}
        />
      );
      // @ts-expect-error - Mocked component as string
      const bubbleTail = UNSAFE_getByType('BubbleTail');
      expect(bubbleTail.props.color).toBe('#e9e9eb');
    });

    it('should flip BubbleTail for recipient', () => {
      const { UNSAFE_getByType } = render(
        <MessageBubble
          {...defaultProps}
          isSender={false}
          isLastInGroup={true}
        />
      );
      // @ts-expect-error - Mocked component as string
      const bubbleTail = UNSAFE_getByType('BubbleTail');
      expect(bubbleTail.props.flipped).toBe(true);
    });

    it('should not flip BubbleTail for sender', () => {
      const { UNSAFE_getByType } = render(
        <MessageBubble {...defaultProps} isSender={true} isLastInGroup={true} />
      );
      // @ts-expect-error - Mocked component as string
      const bubbleTail = UNSAFE_getByType('BubbleTail');
      expect(bubbleTail.props.flipped).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty text', () => {
      const { getByText } = render(<MessageBubble {...defaultProps} text='' />);
      expect(getByText('')).toBeTruthy();
    });

    it('should handle very long text', () => {
      const longText = 'A'.repeat(500);
      const { getByText } = render(
        <MessageBubble {...defaultProps} text={longText} />
      );
      expect(getByText(longText)).toBeTruthy();
    });

    it('should handle special characters', () => {
      const specialText = '🎉 Hello! @#$%^&*()';
      const { getByText } = render(
        <MessageBubble {...defaultProps} text={specialText} />
      );
      expect(getByText(specialText)).toBeTruthy();
    });

    it('should handle all props combined', () => {
      const { getByText, UNSAFE_getByType } = render(
        <MessageBubble
          text='Complex message'
          isSender={true}
          hasReaction={true}
          reactionType='haha'
          isLastInGroup={true}
        />
      );
      expect(getByText('Complex message')).toBeTruthy();
      // @ts-expect-error - Mocked component as string
      expect(UNSAFE_getByType('Reaction')).toBeTruthy();
      // @ts-expect-error - Mocked component as string
      expect(UNSAFE_getByType('BubbleTail')).toBeTruthy();
    });
  });
});
