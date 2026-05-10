import {
  URLParser,
  URLPreview,
  URLPreviewService as IURLPreviewService,
} from './types';

class URLPreviewService implements IURLPreviewService {
  private parsers: Map<string, URLParser> = new Map();

  registerParser(parser: URLParser): void {
    this.parsers.set(parser.name, parser);
  }

  extractURLs(text: string): string[] {
    // Generic URL extraction regex
    const urlRegex = /https?:\/\/[^\s]+/g;
    return text.match(urlRegex) || [];
  }

  cleanTextFromURLs(text: string, urls: string[]): string {
    let cleanText = text;
    urls.forEach(url => {
      cleanText = cleanText.replace(url, '').trim();
    });
    return cleanText;
  }

  async parseURL(text: string): Promise<URLPreview[]> {
    const urls = this.extractURLs(text);
    const previews: URLPreview[] = [];

    for (const url of urls) {
      // Find the first parser that can handle this URL
      for (const parser of this.parsers.values()) {
        if (parser.canHandle(url)) {
          try {
            const preview = await parser.parse(url, text);
            if (preview) {
              previews.push(preview);
              break; // Only use the first matching parser
            }
          } catch (error) {
            console.warn(
              `Parser ${parser.name} failed to parse URL ${url}:`,
              error
            );
          }
        }
      }
    }

    return previews;
  }
}

// Export singleton instance
export const urlPreviewService = new URLPreviewService();
