import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as dbModule from '../../../src/config/db';
import {
  createPin,
  getPinSummariesForTiles,
  getPinsForTiles,
  searchPins,
  updatePinById,
} from '../../../src/modules/pins/pins.service';

vi.mock('../../../src/config/db', () => ({
  getPool: vi.fn(),
}));

describe('pins.service', () => {
  let mockQuery: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockQuery = vi.fn();
    (dbModule.getPool as any).mockReturnValue({
      query: mockQuery,
    });
  });

  it('creates pins with default metadata and derived image arrays', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });

    await createPin({
      title: 'Test pin',
      latitude: 10,
      longitude: 20,
      user_id: 'user-1',
      thumbnail_url: 'https://example.com/image.jpg',
    });

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO pins'),
      [
        'Test pin',
        'general',
        null,
        'active',
        null,
        'public',
        undefined,
        'https://example.com/image.jpg',
        ['https://example.com/image.jpg'],
        10,
        20,
        'user-1',
      ]
    );
  });

  it('updates pins and clears thumbnail/images when none are provided', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await updatePinById('1', 'user-1', {
      title: 'Updated',
    });

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE pins'),
      ['1', 'user-1', 'Updated', 'general', null, 'active', 'public', null, null, []]
    );
  });

  it('returns an empty array for raw tile queries with no tiles', async () => {
    const result = await getPinsForTiles({ tiles: [] });

    expect(result).toEqual([]);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('returns an empty array for summary tile queries with no tiles', async () => {
    const result = await getPinSummariesForTiles({ tiles: [] });

    expect(result).toEqual([]);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('searches public profile fields instead of legacy posted_by values', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    await searchPins({ query: 'abhishek' });

    const searchSql = mockQuery.mock.calls[1][0] as string;

    expect(searchSql).toContain('LEFT JOIN profiles');
    expect(searchSql).toContain('profiles.display_name');
    expect(searchSql).toContain('profiles.username');
    expect(searchSql).not.toContain('posted_by ILIKE');
  });
});
