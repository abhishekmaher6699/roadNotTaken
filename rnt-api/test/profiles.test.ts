import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { getPool } from '../src/config/db';
import { mockSupabaseDb } from './test.setup';

describe('Profiles API Endpoint Tests', () => {
  const mockUserId = 'usr_profile_tester_999';
  const mockAccessToken = 'access_profile_tester_jwt';
  const mockUserEmail = 'profile_tester@trail.com';

  const otherUserId = 'usr_another_explorer_555';
  const otherAccessToken = 'access_another_explorer_jwt';
  const otherUserEmail = 'another_explorer@trail.com';

  const tempUserId = 'usr_new_temporary_999';

  async function seedProfiles() {
    const pool = getPool();
    await pool.query(
      `INSERT INTO profiles (user_id, username, display_name, bio, location)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id) DO UPDATE
       SET username = $2, display_name = $3, bio = $4, location = $5`,
      [mockUserId, 'profile_tester_unique', 'Profile Tester', 'I explore trails', 'Pune, India'],
    );

    await pool.query(
      `INSERT INTO profiles (user_id, username, display_name, bio, location)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id) DO UPDATE
       SET username = $2, display_name = $3, bio = $4, location = $5`,
      [otherUserId, 'another_explorer_unique', 'Another Explorer', 'Into forests', 'Mumbai, India'],
    );
  }

  async function cleanupProfiles() {
    await getPool().query('DELETE FROM profiles WHERE user_id IN ($1, $2, $3)', [
      mockUserId,
      otherUserId,
      tempUserId,
    ]);
  }

  beforeEach(async () => {
    await cleanupProfiles();
    await seedProfiles();

    mockSupabaseDb.users.set(mockUserEmail, { id: mockUserId, email: mockUserEmail });
    mockSupabaseDb.sessions.set(mockAccessToken, {
      user: { id: mockUserId, email: mockUserEmail },
      expiresAt: Date.now() + 3600000,
    });

    mockSupabaseDb.users.set(otherUserEmail, { id: otherUserId, email: otherUserEmail });
    mockSupabaseDb.sessions.set(otherAccessToken, {
      user: { id: otherUserId, email: otherUserEmail },
      expiresAt: Date.now() + 3600000,
    });
  });

  afterEach(cleanupProfiles);
  afterAll(cleanupProfiles);

  describe('GET /profiles/me - Get My Profile', () => {
    it('should retrieve own profile detail', async () => {
      const res = await request(app)
        .get('/profiles/me')
        .set('Cookie', [`access_token=${mockAccessToken}`]);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('user_id', mockUserId);
      expect(res.body).toHaveProperty('username', 'profile_tester_unique');
      expect(res.body).toHaveProperty('display_name', 'Profile Tester');
      expect(res.body).toHaveProperty('email', mockUserEmail);
    });

    it('should auto-create profile if none exists for user', async () => {
      const tempToken = 'access_temp_token_jwt';
      const tempEmail = 'temp_new@trail.com';

      mockSupabaseDb.users.set(tempEmail, { id: tempUserId, email: tempEmail });
      mockSupabaseDb.sessions.set(tempToken, {
        user: { id: tempUserId, email: tempEmail },
        expiresAt: Date.now() + 3600000,
      });

      const res = await request(app)
        .get('/profiles/me')
        .set('Cookie', [`access_token=${tempToken}`]);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('user_id', tempUserId);
      expect(res.body.username).toBeNull();
    });

    it('should return 401 if unauthenticated', async () => {
      const res = await request(app).get('/profiles/me');
      expect(res.status).toBe(401);
    });
  });

  describe('PUT /profiles/me - Update My Profile', () => {
    it('should update own profile parameters successfully', async () => {
      const payload = {
        username: 'profile_tester_updated',
        display_name: 'Explorer Master',
        bio: 'Cozy campground hunter',
        location: 'Cascade Range, OR',
        website: 'https://cascadehunts.com/',
      };

      const res = await request(app)
        .put('/profiles/me')
        .set('Cookie', [`access_token=${mockAccessToken}`])
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('username', payload.username);
      expect(res.body).toHaveProperty('display_name', payload.display_name);
      expect(res.body).toHaveProperty('bio', payload.bio);
      expect(res.body).toHaveProperty('location', payload.location);
      expect(res.body).toHaveProperty('website', payload.website);
    });

    it('should return 409 Conflict if updated username is already taken', async () => {
      const res = await request(app)
        .put('/profiles/me')
        .set('Cookie', [`access_token=${mockAccessToken}`])
        .send({ username: 'another_explorer_unique' });

      expect(res.status).toBe(409);
      expect(res.body).toHaveProperty('error', 'username is already taken');
    });
  });

  describe('GET /profiles/:userId - Get Public Profile', () => {
    it('should fetch profile details for a specific user ID', async () => {
      const res = await request(app).get(`/profiles/${otherUserId}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('user_id', otherUserId);
      expect(res.body.user).toHaveProperty('username', 'another_explorer_unique');
      expect(res.body).toHaveProperty('stats');
      expect(res.body).toHaveProperty('content');
    });

    it('should return 404 for a user ID that does not exist', async () => {
      const res = await request(app).get('/profiles/usr_does_not_exist_999');
      expect(res.status).toBe(404);
    });
  });

  describe('GET /profiles/search - Search Profiles', () => {
    it('should find users by display name or username match', async () => {
      const res = await request(app).get('/profiles/search?q=Explorer');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some((p: any) => p.user_id === otherUserId)).toBe(true);
    });
  });
});
