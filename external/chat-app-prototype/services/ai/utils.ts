export function cleanAIResponseArtifacts(content: string): string {
  return content
    .replace(new RegExp(`TEXT_RESPONSE\\n?`, 'g'), '')
    .replace(new RegExp(`MUSIC_RESPONSE\\n?`, 'g'), '')
    .replace(new RegExp(`MUSIC_QUERY:.*$`, 'gm'), '')
    .trim();
}
