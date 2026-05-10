import mockService from '../mock';
import { RESPONSE_TYPES } from '../../constants';

describe('MockService', () => {
  it('is always configured', () => {
    expect(mockService.isConfigured()).toBe(true);
  });

  it('returns a music response when the last message mentions music', async () => {
    const response = await mockService.generateStructuredResponse([
      { role: 'user', content: 'recommend me a song please' },
    ]);
    expect(response.type).toBe(RESPONSE_TYPES.MUSIC);
    expect(response.musicQuery).toBeDefined();
    expect(response.content.length).toBeGreaterThan(0);
  });

  it('returns a text response when the message is not music-related', async () => {
    const response = await mockService.generateStructuredResponse([
      { role: 'user', content: 'how is your day going' },
    ]);
    expect(response.type).toBe(RESPONSE_TYPES.TEXT);
    expect(response.content.length).toBeGreaterThan(0);
    expect(response.musicQuery).toBeUndefined();
  });

  it('tracks mentioned songs', () => {
    mockService.resetMentionedSongs();
    expect(mockService.getMentionedSongs()).toEqual([]);

    mockService.addMentionedSong('Mr. Brightside');
    mockService.addMentionedSong('mr. brightside'); // duplicate, normalizes lowercase
    mockService.addMentionedSong('Sweet Child O Mine');

    expect(mockService.getMentionedSongs()).toHaveLength(2);
    expect(mockService.getMentionedSongs()).toEqual(
      expect.arrayContaining(['mr. brightside', 'sweet child o mine'])
    );

    mockService.resetMentionedSongs();
    expect(mockService.getMentionedSongs()).toEqual([]);
  });
});
