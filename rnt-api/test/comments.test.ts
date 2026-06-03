import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { getPool } from '../src/config/db';
import { mockSupabaseDb } from './test.setup';

describe('Comments API Endpoint Tests', () => {
  const mockUserId = 'usr_comment_tester_999';
  const mockAccessToken = 'access_comment_tester_jwt';
  const mockUserEmail = 'comment_tester@trail.com';

  const anotherUserId = 'usr_other_commenter_111';
  const anotherAccessToken = 'access_other_commenter_jwt';
  const anotherUserEmail = 'other_commenter@trail.com';

  let testPinId: number;
  let testCommentId: number;

  beforeAll(async () => {
    const pool = getPool();
    // 1. Create profiles
    await pool.query(
      `INSERT INTO profiles (user_id, username, display_name)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE SET username = $2, display_name = $3`,
      [mockUserId, 'comment_tester', 'Comment Tester']
    );
    await pool.query(
      `INSERT INTO profiles (user_id, username, display_name)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE SET username = $2, display_name = $3`,
      [anotherUserId, 'other_commenter', 'Other Commenter']
    );

    // 2. Create a test pin for comment associations
    const pinRes = await pool.query(
      `INSERT INTO pins (title, latitude, longitude, user_id, category)
       VALUES ('TEST_COMMENT_PIN_Parent', 18.5, 73.8, $1, 'forest')
       RETURNING id`,
      [mockUserId]
    );
    testPinId = pinRes.rows[0].id;
  });

  afterAll(async () => {
    const pool = getPool();
    // Delete comments and parents
    await pool.query("DELETE FROM comments WHERE content LIKE 'TEST_%'");
    await pool.query("DELETE FROM pins WHERE id = $1", [testPinId]);
    await pool.query("DELETE FROM profiles WHERE user_id IN ($1, $2)", [mockUserId, anotherUserId]);
  });

  beforeEach(() => {
    // Setup transient Supabase auth sessions
    mockSupabaseDb.users.set(mockUserEmail, { id: mockUserId, email: mockUserEmail });
    mockSupabaseDb.sessions.set(mockAccessToken, {
      user: { id: mockUserId, email: mockUserEmail },
      expiresAt: Date.now() + 3600000
    });

    mockSupabaseDb.users.set(anotherUserEmail, { id: anotherUserId, email: anotherUserEmail });
    mockSupabaseDb.sessions.set(anotherAccessToken, {
      user: { id: anotherUserId, email: anotherUserEmail },
      expiresAt: Date.now() + 3600000
    });
  });

  describe('POST /comments - Create Comment', () => {
    it('should successfully create a new comment when authenticated', async () => {
      const res = await request(app)
        .post('/comments')
        .set('Cookie', [`access_token=${mockAccessToken}`])
        .send({
          pin_id: testPinId,
          content: 'TEST_This is a wonderful coordinate!'
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('content', 'TEST_This is a wonderful coordinate!');
      expect(res.body).toHaveProperty('user_id', mockUserId);
      expect(res.body).toHaveProperty('pin_id', testPinId);

      testCommentId = res.body.id;
    });

    it('should return 400 if content is missing', async () => {
      const res = await request(app)
        .post('/comments')
        .set('Cookie', [`access_token=${mockAccessToken}`])
        .send({ pin_id: testPinId });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'pin_id and content are required');
    });

    it('should return 400 if pinId is missing', async () => {
      const res = await request(app)
        .post('/comments')
        .set('Cookie', [`access_token=${mockAccessToken}`])
        .send({ content: 'TEST_No parent pin' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'pin_id and content are required');
    });

    it('should return 401 if unauthenticated', async () => {
      const res = await request(app)
        .post('/comments')
        .send({ pin_id: testPinId, content: 'TEST_Unauthenticated comment' });

      expect(res.status).toBe(401);
    });

    it('should enforce rate limiting (destructive edge case - max 12 comments)', async () => {
      // Set up a separate user to avoid locking out the main tester
      const rateUser = 'usr_rate_limit_tester';
      const rateToken = 'access_rate_limit_jwt';
      const rateEmail = 'rate@trail.com';

      mockSupabaseDb.users.set(rateEmail, { id: rateUser, email: rateEmail });
      mockSupabaseDb.sessions.set(rateToken, {
        user: { id: rateUser, email: rateEmail },
        expiresAt: Date.now() + 3600000
      });

      // Submit 12 comments successfully
      for (let i = 0; i < 12; i++) {
        const res = await request(app)
          .post('/comments')
          .set('Cookie', [`access_token=${rateToken}`])
          .send({ pin_id: testPinId, content: `TEST_Limit comment ${i}` });
        expect(res.status).toBe(201);
      }

      // The 13th comment should trigger rate limiter returning a 429
      const limitRes = await request(app)
        .post('/comments')
        .set('Cookie', [`access_token=${rateToken}`])
        .send({ pin_id: testPinId, content: 'TEST_Too many comments' });

      expect(limitRes.status).toBe(429);
      expect(limitRes.headers).toHaveProperty('retry-after');
      expect(limitRes.body).toHaveProperty('error');
      expect(limitRes.body.error).toContain('Too many requests');
    });
  });

  describe('GET /comments/pins/:pinId/comments - Comments tree listing', () => {
    it('should list all comments associated with the pin parent', async () => {
      const res = await request(app)
        .get(`/comments/pins/${testPinId}/comments`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some((c: any) => c.id === testCommentId)).toBe(true);
    });
  });

  describe('POST & DELETE /comments/:id/like - Like/Unlike Comment', () => {
    it('should like a comment and increment likes_count', async () => {
      const res = await request(app)
        .post(`/comments/${testCommentId}/like`)
        .set('Cookie', [`access_token=${mockAccessToken}`]);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('liked', true);
      expect(res.body).toHaveProperty('likes_count');
      expect(res.body.likes_count).toBeGreaterThanOrEqual(1);
    });

    it('should unlike a comment and decrement likes_count', async () => {
      const res = await request(app)
        .delete(`/comments/${testCommentId}/like`)
        .set('Cookie', [`access_token=${mockAccessToken}`]);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('liked', false);
    });
  });

  describe('DELETE /comments/:id - Delete Comment', () => {
    it('should prevent non-owners from deleting the comment', async () => {
      const res = await request(app)
        .delete(`/comments/${testCommentId}`)
        .set('Cookie', [`access_token=${anotherAccessToken}`]);

      expect(res.status).toBe(404); // Returns 404 since it filters by ownership in comments.service.ts
    });

    it('should allow the owner to delete the comment', async () => {
      const res = await request(app)
        .delete(`/comments/${testCommentId}`)
        .set('Cookie', [`access_token=${mockAccessToken}`]);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', testCommentId);
    });
  });
});
