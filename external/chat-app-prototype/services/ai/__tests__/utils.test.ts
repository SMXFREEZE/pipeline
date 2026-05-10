import { cleanAIResponseArtifacts } from '../utils';

describe('cleanAIResponseArtifacts', () => {
  it('strips TEXT_RESPONSE markers', () => {
    expect(cleanAIResponseArtifacts('TEXT_RESPONSE\nhello')).toBe('hello');
  });

  it('strips MUSIC_RESPONSE markers', () => {
    expect(cleanAIResponseArtifacts('MUSIC_RESPONSE\nlove this song')).toBe(
      'love this song'
    );
  });

  it('removes MUSIC_QUERY lines entirely', () => {
    const input = 'love this song\nMUSIC_QUERY:search:foo bar';
    expect(cleanAIResponseArtifacts(input)).toBe('love this song');
  });

  it('handles multiple artifacts together', () => {
    const input =
      'MUSIC_RESPONSE\nthis one rules\nMUSIC_QUERY:search:something';
    expect(cleanAIResponseArtifacts(input)).toBe('this one rules');
  });

  it('returns input unchanged when no artifacts present', () => {
    expect(cleanAIResponseArtifacts('plain text reply')).toBe(
      'plain text reply'
    );
  });

  it('trims surrounding whitespace', () => {
    expect(cleanAIResponseArtifacts('   hello   ')).toBe('hello');
  });
});
