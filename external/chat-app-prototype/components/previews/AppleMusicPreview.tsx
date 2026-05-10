import React from 'react';
import AppleMusicBubble from '../bubbles/AppleMusicBubble';
import { PreviewComponentProps } from '../../services/urlPreview/types';

const AppleMusicPreview: React.FC<PreviewComponentProps> = ({
  preview,
  isSender,
  isLastInGroup = false,
  hasReaction = false,
  reactionType,
  maxWidth,
  playDisabled = false,
}) => {
  return (
    <AppleMusicBubble
      songId={preview.metadata.songId}
      isSender={isSender}
      isLastInGroup={isLastInGroup}
      hasReaction={hasReaction}
      reactionType={reactionType}
      useDynamicColors={true}
      maxWidth={maxWidth}
      playDisabled={playDisabled}
    />
  );
};

export default AppleMusicPreview;
