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
  const thirdUserId = 'usr_third_explorer_777';
  const thirdAccessToken = 'access_third_explorer_jwt';
  const thirdUserEmail = 'third_explorer@trail.com';

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

    await pool.query(
      `INSERT INTO profiles (user_id, username, display_name, bio, location)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id) DO UPDATE
       SET username = $2, display_name = $3, bio = $4, location = $5`,
      [thirdUserId, 'third_explorer_unique', 'Third Explorer', 'Follows quietly', 'Delhi, India'],
    );
  }

  async function cleanupProfiles() {
    try {
      await getPool().query(
        `DELETE FROM profile_follows
         WHERE follower_user_id IN ($1, $2, $3, $4)
            OR following_user_id IN ($1, $2, $3, $4)`,
        [mockUserId, otherUserId, tempUserId, thirdUserId],
      );
    } catch (error: any) {
      if (error?.code !== '42P01') {
        throw error;
      }
    }

    await getPool().query('DELETE FROM profiles WHERE user_id IN ($1, $2, $3, $4)', [
      mockUserId,
      otherUserId,
      tempUserId,
      thirdUserId,
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

    mockSupabaseDb.users.set(thirdUserEmail, { id: thirdUserId, email: thirdUserEmail });
    mockSupabaseDb.sessions.set(thirdAccessToken, {
      user: { id: thirdUserId, email: thirdUserEmail },
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
      expect(res.body.stats).toMatchObject({
        followers_count: 0,
        following_count: 0,
      });
      expect(res.body).toHaveProperty('viewer_has_followed', false);
      expect(res.body).toHaveProperty('content');
    });

    it('should return 404 for a user ID that does not exist', async () => {
      const res = await request(app).get('/profiles/usr_does_not_exist_999');
      expect(res.status).toBe(404);
    });
  });

  describe('POST & DELETE /profiles/:userId/follow - Follow Profiles', () => {
    it('should follow a profile and update public profile viewer state', async () => {
      const followRes = await request(app)
        .post(`/profiles/${otherUserId}/follow`)
        .set('Cookie', [`access_token=${mockAccessToken}`]);

      expect(followRes.status).toBe(200);
      expect(followRes.body).toEqual({
        following: true,
        followers_count: 1,
        following_count: 1,
      });

      const profileRes = await request(app)
        .get(`/profiles/${otherUserId}`)
        .set('Cookie', [`access_token=${mockAccessToken}`]);

      expect(profileRes.status).toBe(200);
      expect(profileRes.body).toHaveProperty('viewer_has_followed', true);
      expect(profileRes.body.stats).toMatchObject({
        followers_count: 1,
        following_count: 0,
      });

      const viewerProfileRes = await request(app)
        .get(`/profiles/${mockUserId}`)
        .set('Cookie', [`access_token=${mockAccessToken}`]);

      expect(viewerProfileRes.status).toBe(200);
      expect(viewerProfileRes.body.stats).toMatchObject({
        followers_count: 0,
        following_count: 1,
      });
    });

    it('should make duplicate follows idempotent', async () => {
      await request(app)
        .post(`/profiles/${otherUserId}/follow`)
        .set('Cookie', [`access_token=${mockAccessToken}`]);

      const res = await request(app)
        .post(`/profiles/${otherUserId}/follow`)
        .set('Cookie', [`access_token=${mockAccessToken}`]);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        following: true,
        followers_count: 1,
        following_count: 1,
      });
    });

    it('should unfollow a profile and update counts', async () => {
      await request(app)
        .post(`/profiles/${otherUserId}/follow`)
        .set('Cookie', [`access_token=${mockAccessToken}`]);

      const unfollowRes = await request(app)
        .delete(`/profiles/${otherUserId}/follow`)
        .set('Cookie', [`access_token=${mockAccessToken}`]);

      expect(unfollowRes.status).toBe(200);
      expect(unfollowRes.body).toEqual({
        following: false,
        followers_count: 0,
        following_count: 0,
      });
    });

    it('should make unfollowing a profile that is not followed idempotent', async () => {
      const res = await request(app)
        .delete(`/profiles/${otherUserId}/follow`)
        .set('Cookie', [`access_token=${mockAccessToken}`]);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        following: false,
        followers_count: 0,
        following_count: 0,
      });
    });

    it('should reject self-follow', async () => {
      const res = await request(app)
        .post(`/profiles/${mockUserId}/follow`)
        .set('Cookie', [`access_token=${mockAccessToken}`]);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'You cannot follow yourself');
    });

    it('should return 401 when following unauthenticated', async () => {
      const res = await request(app).post(`/profiles/${otherUserId}/follow`);

      expect(res.status).toBe(401);
    });

    it('should return 404 when following a missing profile', async () => {
      const res = await request(app)
        .post('/profiles/usr_missing_follow_target/follow')
        .set('Cookie', [`access_token=${mockAccessToken}`]);

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'Profile not found');
    });
  });

  describe('GET /profiles/:userId/followers and /following - Follow Lists', () => {
    it('should list followers with viewer follow state', async () => {
      await request(app)
        .post(`/profiles/${otherUserId}/follow`)
        .set('Cookie', [`access_token=${mockAccessToken}`]);
      await request(app)
        .post(`/profiles/${otherUserId}/follow`)
        .set('Cookie', [`access_token=${thirdAccessToken}`]);
      await request(app)
        .post(`/profiles/${thirdUserId}/follow`)
        .set('Cookie', [`access_token=${mockAccessToken}`]);

      const res = await request(app)
        .get(`/profiles/${otherUserId}/followers`)
        .set('Cookie', [`access_token=${mockAccessToken}`]);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.users)).toBe(true);
      expect(res.body.users).toHaveLength(2);
      expect(res.body).toHaveProperty('has_more', false);
      expect(res.body).toHaveProperty('next_cursor', null);

      const thirdUser = res.body.users.find((user: any) => user.user_id === thirdUserId);
      expect(thirdUser).toMatchObject({
        username: 'third_explorer_unique',
        viewer_has_followed: true,
      });
    });

    it('should list following profiles with cursor pagination', async () => {
      await request(app)
        .post(`/profiles/${otherUserId}/follow`)
        .set('Cookie', [`access_token=${mockAccessToken}`]);
      await request(app)
        .post(`/profiles/${thirdUserId}/follow`)
        .set('Cookie', [`access_token=${mockAccessToken}`]);

      const firstPage = await request(app)
        .get(`/profiles/${mockUserId}/following?limit=1`)
        .set('Cookie', [`access_token=${mockAccessToken}`]);

      expect(firstPage.status).toBe(200);
      expect(firstPage.body.users).toHaveLength(1);
      expect(firstPage.body).toHaveProperty('has_more', true);
      expect(typeof firstPage.body.next_cursor).toBe('string');

      const secondPage = await request(app)
        .get(`/profiles/${mockUserId}/following?limit=1&cursor=${encodeURIComponent(firstPage.body.next_cursor)}`)
        .set('Cookie', [`access_token=${mockAccessToken}`]);

      expect(secondPage.status).toBe(200);
      expect(secondPage.body.users).toHaveLength(1);
      expect(secondPage.body.users[0].user_id).not.toBe(firstPage.body.users[0].user_id);
      expect(secondPage.body).toHaveProperty('has_more', false);
      expect(secondPage.body).toHaveProperty('next_cursor', null);
    });

    it('should clamp follow list limits to the server maximum', async () => {
      await request(app)
        .post(`/profiles/${otherUserId}/follow`)
        .set('Cookie', [`access_token=${mockAccessToken}`]);
      await request(app)
        .post(`/profiles/${thirdUserId}/follow`)
        .set('Cookie', [`access_token=${mockAccessToken}`]);

      const res = await request(app)
        .get(`/profiles/${mockUserId}/following?limit=999`)
        .set('Cookie', [`access_token=${mockAccessToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.users).toHaveLength(2);
      expect(res.body).toHaveProperty('has_more', false);
    });

    it('should return 404 when listing follows for a missing profile', async () => {
      const res = await request(app).get('/profiles/usr_missing_follow_list/followers');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'Profile not found');
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
