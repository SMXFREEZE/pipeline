export type ReactionType = 'heart' | 'thumbsUp' | 'haha' | 'doubleExclamation';

export const getReactionEmoji = (reactionType: ReactionType): string => {
  const reactionMap: Record<ReactionType, string> = {
    heart: '❤️',
    thumbsUp: '👍',
    haha: '😂',
    doubleExclamation: '‼️',
  };

  return reactionMap[reactionType];
};
