export interface URLPreview {
  id: string;
  type: string;
  url: string;
  metadata: Record<string, any>;
}

export interface URLParser {
  name: string;
  pattern: RegExp;
  canHandle: (url: string) => boolean;
  parse: (url: string, text: string) => Promise<URLPreview | null>;
}

export interface PreviewComponentProps {
  preview: URLPreview;
  isSender: boolean;
  isLastInGroup?: boolean;
  hasReaction?: boolean;
  reactionType?: 'heart' | 'thumbsUp' | 'haha' | 'doubleExclamation';
  maxWidth?: string;
  playDisabled?: boolean;
  onRemove?: () => void;
}

export interface URLPreviewService {
  registerParser: (parser: URLParser) => void;
  parseURL: (text: string) => Promise<URLPreview[]>;
  extractURLs: (text: string) => string[];
  cleanTextFromURLs: (text: string, urls: string[]) => string;
}
