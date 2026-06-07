import { describe, it, expect, beforeEach, beforeAll, afterAll, afterEach } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { getPool } from '../src/config/db';
import { mockSupabaseDb } from './test.setup';

describe('Pins API Endpoint Tests', () => {
  const mockUserId = 'usr_pin_tester_999';
  const mockAccessToken = 'access_pin_tester_jwt';
  const mockUserEmail = 'pin_tester@trail.com';

  const anotherUserId = 'usr_other_explorer_111';
  const anotherAccessToken = 'access_other_explorer_jwt';
  const anotherUserEmail = 'other@trail.com';

  let titleCounter = 0;

  function uniqueTitle(label: string) {
    titleCounter += 1;
    return `TEST_PIN_${label}_${titleCounter}`;
  }

  function buildPinPayload(title = uniqueTitle('Default')) {
    return {
      title,
      description: 'A beautiful hidden clearing under a giant oak tree.',
      latitude: 18.524,
      longitude: 73.856,
      category: 'general',
      status: 'active',
      access_level: 'public',
      address: 'Hills of Pune, India',
      thumbnail_url: 'https://cloudinary.com/test_thumb.jpg',
      image_urls: ['https://cloudinary.com/test_thumb.jpg'],
    };
  }

  async function createTestPin(title = uniqueTitle('Seed')) {
    const payload = buildPinPayload(title);
    const res = await request(app)
      .post('/pins')
      .set('Cookie', [`access_token=${mockAccessToken}`])
      .send(payload);

    expect(res.status).toBe(201);
    return res.body;
  }

  beforeAll(async () => {
    const pool = getPool();
    await pool.query(
      `INSERT INTO profiles (user_id, username, display_name)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE SET username = $2, display_name = $3`,
      [mockUserId, 'pin_tester', 'Pin Tester'],
    );
    await pool.query(
      `INSERT INTO profiles (user_id, username, display_name)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE SET username = $2, display_name = $3`,
      [anotherUserId, 'other_explorer', 'Other Explorer'],
    );
  });

  beforeEach(async () => {
    await getPool().query('DELETE FROM pins WHERE user_id IN ($1, $2)', [
      mockUserId,
      anotherUserId,
    ]);

    mockSupabaseDb.users.set(mockUserEmail, { id: mockUserId, email: mockUserEmail });
    mockSupabaseDb.sessions.set(mockAccessToken, {
      user: { id: mockUserId, email: mockUserEmail },
      expiresAt: Date.now() + 3600000,
    });

    mockSupabaseDb.users.set(anotherUserEmail, { id: anotherUserId, email: anotherUserEmail });
    mockSupabaseDb.sessions.set(anotherAccessToken, {
      user: { id: anotherUserId, email: anotherUserEmail },
      expiresAt: Date.now() + 3600000,
    });
  });

  afterEach(async () => {
    await getPool().query('DELETE FROM pins WHERE user_id IN ($1, $2)', [
      mockUserId,
      anotherUserId,
    ]);
  });

  afterAll(async () => {
    await getPool().query('DELETE FROM profiles WHERE user_id IN ($1, $2)', [
      mockUserId,
      anotherUserId,
    ]);
  });

  describe('POST /pins - Create Pin', () => {
    it('should successfully create a new pin with geometry when authenticated', async () => {
      const payload = buildPinPayload(uniqueTitle('Create'));

      const res = await request(app)
        .post('/pins')
        .set('Cookie', [`access_token=${mockAccessToken}`])
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('title', payload.title);
      expect(res.body).toHaveProperty('latitude', payload.latitude);
      expect(res.body).toHaveProperty('longitude', payload.longitude);
      expect(res.body).toHaveProperty('author');
      expect(res.body.author).toHaveProperty('username', 'pin_tester');
      expect(res.body).toHaveProperty('likes_count', 0);
      expect(res.body).toHaveProperty('visits_count', 0);
      expect(res.body).toHaveProperty('viewer_has_liked', false);
      expect(res.body).toHaveProperty('viewer_has_visited', false);
    });

    it('should fail with 401 Unauthorized if no token is provided', async () => {
      const res = await request(app)
        .post('/pins')
        .send({ title: uniqueTitle('Unauthorized'), latitude: 12, longitude: 12 });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /pins - Get Pins', () => {
    it('should return a list of pins containing a created test pin', async () => {
      const pin = await createTestPin(uniqueTitle('List'));

      const res = await request(app).get('/pins');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.pins)).toBe(true);
      expect(typeof res.body.has_more).toBe('boolean');
      expect(res.body).toHaveProperty('next_cursor');
      const found = res.body.pins.find((p: any) => p.id === pin.id);
      expect(found).toBeDefined();
      expect(found).toHaveProperty('title', pin.title);
    });

    it('should paginate pins with a cursor', async () => {
      await createTestPin(uniqueTitle('PageFirst'));
      await createTestPin(uniqueTitle('PageSecond'));

      const firstPage = await request(app).get('/pins?limit=1');

      expect(firstPage.status).toBe(200);
      expect(firstPage.body.pins).toHaveLength(1);
      expect(firstPage.body).toHaveProperty('has_more', true);
      expect(typeof firstPage.body.next_cursor).toBe('string');

      const secondPage = await request(app)
        .get(`/pins?limit=1&cursor=${encodeURIComponent(firstPage.body.next_cursor)}`);

      expect(secondPage.status).toBe(200);
      expect(secondPage.body.pins).toHaveLength(1);
      expect(secondPage.body.pins[0].id).not.toBe(firstPage.body.pins[0].id);
      expect(typeof secondPage.body.has_more).toBe('boolean');
      expect(secondPage.body).toHaveProperty('next_cursor');
    });
  });

  describe('GET /pins/:id - Get Single Pin', () => {
    it('should fetch details of a created test pin', async () => {
      const pin = await createTestPin(uniqueTitle('Single'));

      const res = await request(app).get(`/pins/${pin.id}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', pin.id);
      expect(res.body).toHaveProperty('title', pin.title);
    });

    it('should return 404 for non-existent pin ID', async () => {
      const res = await request(app).get('/pins/999999');
      expect(res.status).toBe(404);
    });

    it('should return 400 for malformed pin ID', async () => {
      const res = await request(app).get('/pins/not-a-number');
      expect(res.status).toBe(400);
    });
  });

  describe('PUT /pins/:id - Update Pin', () => {
    it('should allow the owner to update the pin properties', async () => {
      const pin = await createTestPin(uniqueTitle('Update'));
      const payload = {
        title: uniqueTitle('Updated'),
        category: 'forest',
        description: 'Updated descriptions here.',
        access_level: 'private',
      };

      const res = await request(app)
        .put(`/pins/${pin.id}`)
        .set('Cookie', [`access_token=${mockAccessToken}`])
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('title', payload.title);
      expect(res.body).toHaveProperty('category', payload.category);
      expect(res.body).toHaveProperty('access_level', payload.access_level);
      expect(res.body.author).toHaveProperty('username', 'pin_tester');
    });

    it('should prevent non-owners from updating the pin', async () => {
      const pin = await createTestPin(uniqueTitle('NonOwnerUpdate'));

      const res = await request(app)
        .put(`/pins/${pin.id}`)
        .set('Cookie', [`access_token=${anotherAccessToken}`])
        .send({ title: uniqueTitle('Hacked') });

      expect(res.status).toBe(404);
    });
  });

  describe('POST & DELETE /pins/:id/like - Like/Unlike Pin', () => {
    it('should like the pin and increment likes_count', async () => {
      const pin = await createTestPin(uniqueTitle('Like'));

      const res = await request(app)
        .post(`/pins/${pin.id}/like`)
        .set('Cookie', [`access_token=${mockAccessToken}`]);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ liked: true, likes_count: 1 });

      const dbRes = await request(app).get(`/pins/${pin.id}`);
      expect(dbRes.body.likes_count).toBe(1);
    });

    it('should unlike the pin and decrement likes_count', async () => {
      const pin = await createTestPin(uniqueTitle('Unlike'));
      await request(app)
        .post(`/pins/${pin.id}/like`)
        .set('Cookie', [`access_token=${mockAccessToken}`]);

      const res = await request(app)
        .delete(`/pins/${pin.id}/like`)
        .set('Cookie', [`access_token=${mockAccessToken}`]);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ liked: false, likes_count: 0 });

      const dbRes = await request(app).get(`/pins/${pin.id}`);
      expect(dbRes.body.likes_count).toBe(0);
    });
  });

  describe('POST & DELETE /pins/:id/visit - Visit/Unvisit Pin', () => {
    it('should log a visit and increment visits_count', async () => {
      const pin = await createTestPin(uniqueTitle('Visit'));

      const res = await request(app)
        .post(`/pins/${pin.id}/visit`)
        .set('Cookie', [`access_token=${mockAccessToken}`]);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ visited: true, visits_count: 1 });

      const dbRes = await request(app).get(`/pins/${pin.id}`);
      expect(dbRes.body.visits_count).toBe(1);
    });

    it('should unvisit the pin and decrement visits_count', async () => {
      const pin = await createTestPin(uniqueTitle('Unvisit'));
      await request(app)
        .post(`/pins/${pin.id}/visit`)
        .set('Cookie', [`access_token=${mockAccessToken}`]);

      const res = await request(app)
        .delete(`/pins/${pin.id}/visit`)
        .set('Cookie', [`access_token=${mockAccessToken}`]);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ visited: false, visits_count: 0 });

      const dbRes = await request(app).get(`/pins/${pin.id}`);
      expect(dbRes.body.visits_count).toBe(0);
    });
  });

  describe('GET /pins/search - Search Pins', () => {
    it('should find pin based on trigram relevance title', async () => {
      const pin = await createTestPin('TEST_PIN_Cozy Oak Campfire Search');

      const res = await request(app).get('/pins/search?q=Campfire');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some((p: any) => p.id === pin.id)).toBe(true);
    });

    it('should find pin with geolocation proximity boost', async () => {
      const pin = await createTestPin('TEST_PIN_Cozy Oak Campfire Near Pune');

      const res = await request(app).get('/pins/search?q=Campfire&lat=18.52&lng=73.85');

      expect(res.status).toBe(200);
      expect(res.body.some((p: any) => p.id === pin.id)).toBe(true);
    });
  });

  describe('POST /pins/tiles/query & summary - Grid Viewport Queries', () => {
    const validTile = { x: 2888, y: 1833, z: 12 };

    it('should fetch pins matching the tile query bounds', async () => {
      const pin = await createTestPin(uniqueTitle('Tile'));

      const res = await request(app)
        .post('/pins/tiles/query')
        .send({ tiles: [validTile] });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('pins');
      expect(Array.isArray(res.body.pins)).toBe(true);
      expect(res.body.pins.some((p: any) => p.id === pin.id)).toBe(true);
    });

    it('should fetch aggregated tile summaries', async () => {
      await createTestPin(uniqueTitle('Summary'));

      const res = await request(app)
        .post('/pins/tiles/summary')
        .send({ tiles: [validTile] });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('summaries');
      expect(Array.isArray(res.body.summaries)).toBe(true);
      expect(res.body.summaries.some((summary: any) => summary.pin_count > 0)).toBe(true);
    });

    it('should allow larger summary tile batches than raw pin tile batches', async () => {
      const summaryTiles = Array.from({ length: 65 }, (_, index) => ({
        x: 2888 + index,
        y: 1833,
        z: 12,
      }));

      const res = await request(app)
        .post('/pins/tiles/summary')
        .send({ tiles: summaryTiles });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('tiles');
      expect(res.body.tiles).toHaveLength(summaryTiles.length);
    });

    it('should return 400 for invalid tile boundaries', async () => {
      const res = await request(app)
        .post('/pins/tiles/query')
        .send({ tiles: [{ x: 'bad', y: 1833, z: 12 }] });

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /pins/:id - Delete Pin', () => {
    it('should prevent non-owners from deleting the pin', async () => {
      const pin = await createTestPin(uniqueTitle('NonOwnerDelete'));

      const res = await request(app)
        .delete(`/pins/${pin.id}`)
        .set('Cookie', [`access_token=${anotherAccessToken}`]);

      expect(res.status).toBe(404);
    });

    it('should allow the owner to delete the pin', async () => {
      const pin = await createTestPin(uniqueTitle('Delete'));

      const res = await request(app)
        .delete(`/pins/${pin.id}`)
        .set('Cookie', [`access_token=${mockAccessToken}`]);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id');

      const dbRes = await request(app).get(`/pins/${pin.id}`);
      expect(dbRes.status).toBe(404);
    });
  });
});
