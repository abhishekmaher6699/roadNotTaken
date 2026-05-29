import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import app from '../../../src/app';
import * as dbModule from '../../../src/config/db';
import * as supabaseConfig from '../../../src/config/supabase';

vi.mock('../../../src/config/db', () => ({
  getPool: vi.fn(),
}));

vi.mock('../../../src/config/supabase', () => ({
  getSupabaseClient: vi.fn(),
}));

describe('Pins routes', () => {
  let mockQuery: ReturnType<typeof vi.fn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    mockQuery = vi.fn();
    (dbModule.getPool as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      query: mockQuery,
    });

    (supabaseConfig.getSupabaseClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: 'mock-user',
              email: 'owner@example.com',
            },
          },
          error: null,
        }),
      },
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('lists pins from the database', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, title: 'Pin 1' }],
    });

    const response = await request(app).get('/pins');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([{ id: 1, title: 'Pin 1' }]);
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  it('returns raw tile pins in the API response shape', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, title: 'Tile pin' }],
    });

    const tiles = [{ x: 1, y: 2, z: 3 }];
    const response = await request(app)
      .post('/pins/tiles/query')
      .send({ tiles });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      pins: [{ id: 1, title: 'Tile pin' }],
      tiles,
    });
  });

  it('returns an empty raw tile response when no tiles are requested', async () => {
    const response = await request(app)
      .post('/pins/tiles/query')
      .send({ tiles: [] });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      pins: [],
      tiles: [],
    });
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('rejects invalid raw tile requests before hitting the database', async () => {
    const response = await request(app)
      .post('/pins/tiles/query')
      .send({ tiles: [{ x: 1.5, y: 2, z: 3 }] });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Invalid tile query' });
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('returns tile summaries in the API response shape', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ x: 1, y: 2, z: 3, pin_count: 4, latitude: 10, longitude: 20 }],
    });

    const tiles = [{ x: 1, y: 2, z: 3 }];
    const response = await request(app)
      .post('/pins/tiles/summary')
      .send({ tiles });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      summaries: [{ x: 1, y: 2, z: 3, pin_count: 4, latitude: 10, longitude: 20 }],
      tiles,
    });
  });

  it('returns an empty summary response when no tiles are requested', async () => {
    const response = await request(app)
      .post('/pins/tiles/summary')
      .send({ tiles: [] });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      summaries: [],
      tiles: [],
    });
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('rejects invalid summary tile requests before hitting the database', async () => {
    const response = await request(app)
      .post('/pins/tiles/summary')
      .send({ tiles: [{ x: 1, y: 'two', z: 3 }] });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Invalid tile query' });
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('requires authentication to create a pin', async () => {
    const response = await request(app).post('/pins').send({ title: 'New pin' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'No token provided' });
  });

  it('creates a pin for the authenticated user', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 99, title: 'New pin', user_id: 'mock-user' }],
    });

    const response = await request(app)
      .post('/pins')
      .set('Authorization', 'Bearer valid-token')
      .send({
        title: 'New pin',
        latitude: 10,
        longitude: 20,
        category: 'nature',
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      id: 99,
      title: 'New pin',
      user_id: 'mock-user',
    });
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO pins'),
      expect.arrayContaining(['mock-user'])
    );
    expect(mockQuery.mock.calls[0][1]).not.toContain('owner@example.com');
  });

  it('returns 401 when create pin auth token is invalid', async () => {
    (supabaseConfig.getSupabaseClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'Invalid token' },
        }),
      },
    });

    const response = await request(app)
      .post('/pins')
      .set('Authorization', 'Bearer bad-token')
      .send({ title: 'New pin', latitude: 1, longitude: 2 });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Invalid token' });
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('updates a pin owned by the authenticated user', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 15,
          title: 'Updated title',
          user_id: 'mock-user',
          updated_at: '2026-04-15T00:00:00.000Z',
        },
      ],
    });

    const response = await request(app)
      .put('/pins/15')
      .set('Authorization', 'Bearer valid-token')
      .send({
        title: 'Updated title',
        category: 'history',
        address: 'Somewhere',
        status: 'active',
        access_level: 'public',
        description: 'Updated description',
        image_urls: ['https://example.com/1.jpg'],
        thumbnail_url: 'https://example.com/1.jpg',
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: 15,
      title: 'Updated title',
      user_id: 'mock-user',
    });
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE pins'),
      expect.arrayContaining(['15', 'mock-user', 'Updated title'])
    );
  });

  it('returns 404 when updating a pin the user does not own', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const response = await request(app)
      .put('/pins/15')
      .set('Authorization', 'Bearer valid-token')
      .send({
        title: 'Updated title',
      });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: 'Pin not found or not owned by user',
    });
  });

  it('requires authentication to update a pin', async () => {
    const response = await request(app)
      .put('/pins/15')
      .send({ title: 'Updated title' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'No token provided' });
  });

  it('deletes a pin owned by the authenticated user', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 15 }],
    });

    const response = await request(app)
      .delete('/pins/15')
      .set('Authorization', 'Bearer valid-token');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ id: 15 });
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM pins'),
      ['15', 'mock-user']
    );
  });

  it('returns 404 when deleting a pin the user does not own', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const response = await request(app)
      .delete('/pins/15')
      .set('Authorization', 'Bearer valid-token');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: 'Pin not found or not owned by user',
    });
  });

  it('requires authentication to delete a pin', async () => {
    const response = await request(app).delete('/pins/15');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'No token provided' });
  });
});
