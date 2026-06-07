import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { getPool } from '../src/config/db';
import { mockSupabaseDb } from './test.setup';

describe('Comments API Endpoint Tests', () => {
  const ownerUserId = 'usr_comment_owner_999';
  const ownerAccessToken = 'access_comment_owner_jwt';
  const ownerEmail = 'comment_owner@trail.com';

  const otherUserId = 'usr_comment_other_111';
  const otherAccessToken = 'access_comment_other_jwt';
  const otherEmail = 'comment_other@trail.com';

  let titleCounter = 0;

  function uniqueTitle(label: string) {
    titleCounter += 1;
    return `TEST_COMMENT_PIN_${label}_${titleCounter}`;
  }

  async function cleanupData() {
    await getPool().query('DELETE FROM pins WHERE user_id IN ($1, $2)', [
      ownerUserId,
      otherUserId,
    ]);
    await getPool().query('DELETE FROM profiles WHERE user_id IN ($1, $2)', [
      ownerUserId,
      otherUserId,
    ]);
  }

  async function seedProfiles() {
    await getPool().query(
      `INSERT INTO profiles (user_id, username, display_name, avatar_url)
       VALUES ($1, $2, $3, $4), ($5, $6, $7, $8)
       ON CONFLICT (user_id) DO UPDATE
       SET username = EXCLUDED.username,
           display_name = EXCLUDED.display_name,
           avatar_url = EXCLUDED.avatar_url`,
      [
        ownerUserId,
        'comment_owner',
        'Comment Owner',
        'https://example.com/owner.jpg',
        otherUserId,
        'comment_other',
        'Comment Other',
        'https://example.com/other.jpg',
      ],
    );
  }

  async function createTestPin() {
    const res = await request(app)
      .post('/pins')
      .set('Cookie', [`access_token=${ownerAccessToken}`])
      .send({
        title: uniqueTitle('Seed'),
        description: 'A pin for comment API tests.',
        latitude: 18.524,
        longitude: 73.856,
        category: 'general',
        status: 'active',
        access_level: 'public',
      });

    expect(res.status).toBe(201);
    return res.body;
  }

  async function createTestComment(pinId: number, content = 'A useful field note') {
    const res = await request(app)
      .post('/comments')
      .set('Cookie', [`access_token=${ownerAccessToken}`])
      .send({ pin_id: pinId, content });

    expect(res.status).toBe(201);
    return res.body;
  }

  beforeEach(async () => {
    await cleanupData();
    await seedProfiles();

    mockSupabaseDb.users.set(ownerEmail, { id: ownerUserId, email: ownerEmail });
    mockSupabaseDb.sessions.set(ownerAccessToken, {
      user: { id: ownerUserId, email: ownerEmail },
      expiresAt: Date.now() + 3600000,
    });

    mockSupabaseDb.users.set(otherEmail, { id: otherUserId, email: otherEmail });
    mockSupabaseDb.sessions.set(otherAccessToken, {
      user: { id: otherUserId, email: otherEmail },
      expiresAt: Date.now() + 3600000,
    });
  });

  afterEach(cleanupData);
  afterAll(cleanupData);

  describe('POST /comments - Create Comment', () => {
    it('should create a top-level comment with author profile fields', async () => {
      const pin = await createTestPin();

      const res = await request(app)
        .post('/comments')
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .send({ pin_id: pin.id, content: '  This place has a quiet trailhead.  ' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('pin_id', pin.id);
      expect(res.body).toHaveProperty('content', 'This place has a quiet trailhead.');
      expect(res.body).toHaveProperty('parent_comment_id', null);
      expect(res.body).toHaveProperty('user_id', ownerUserId);
      expect(res.body).toHaveProperty('likes_count', 0);
      expect(res.body).toHaveProperty('viewer_has_liked', false);
      expect(res.body.author).toMatchObject({
        id: ownerUserId,
        username: 'comment_owner',
        display_name: 'Comment Owner',
        avatar_url: 'https://example.com/owner.jpg',
      });
    });

    it('should create a reply when parent comment belongs to the same pin', async () => {
      const pin = await createTestPin();
      const parent = await createTestComment(pin.id, 'Parent comment');

      const res = await request(app)
        .post('/comments')
        .set('Cookie', [`access_token=${otherAccessToken}`])
        .send({
          pin_id: pin.id,
          parent_comment_id: parent.id,
          content: 'Reply from another explorer',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('parent_comment_id', parent.id);
      expect(res.body).toHaveProperty('user_id', otherUserId);
      expect(res.body.author).toMatchObject({
        id: otherUserId,
        username: 'comment_other',
      });

      const pinRes = await request(app).get(`/pins/${pin.id}`);
      expect(pinRes.status).toBe(200);
      expect(pinRes.body).toHaveProperty('comment_count', 2);
    });

    it('should reject empty comments', async () => {
      const pin = await createTestPin();

      const res = await request(app)
        .post('/comments')
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .send({ pin_id: pin.id, content: '   ' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Comment content cannot be empty');
    });

    it('should reject comments for a missing pin', async () => {
      const res = await request(app)
        .post('/comments')
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .send({ pin_id: 999999, content: 'Ghost pin comment' });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'Pin not found');
    });

    it('should return 401 when unauthenticated', async () => {
      const res = await request(app)
        .post('/comments')
        .send({ pin_id: 1, content: 'No auth here' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /comments/pins/:pinId/comments - List Comments', () => {
    it('should list comments for a pin and include viewer like state', async () => {
      const pin = await createTestPin();
      const comment = await createTestComment(pin.id, 'Visible comment');

      await request(app)
        .post(`/comments/${comment.id}/like`)
        .set('Cookie', [`access_token=${otherAccessToken}`]);

      const res = await request(app)
        .get(`/comments/pins/${pin.id}/comments`)
        .set('Cookie', [`access_token=${otherAccessToken}`]);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.comments)).toBe(true);
      expect(res.body).toHaveProperty('has_more', false);
      expect(res.body).toHaveProperty('next_cursor', null);
      expect(res.body).toHaveProperty('comment_count', 1);
      const found = res.body.comments.find((item: any) => item.id === comment.id);
      expect(found).toBeDefined();
      expect(found).toHaveProperty('likes_count', 1);
      expect(found).toHaveProperty('viewer_has_liked', true);
      expect(found.author).toMatchObject({
        username: 'comment_owner',
        display_name: 'Comment Owner',
      });
    });

    it('should paginate comments with a cursor', async () => {
      const pin = await createTestPin();
      const first = await createTestComment(pin.id, 'First visible comment');
      const second = await createTestComment(pin.id, 'Second visible comment');

      const firstPage = await request(app)
        .get(`/comments/pins/${pin.id}/comments?limit=1`);

      expect(firstPage.status).toBe(200);
      expect(firstPage.body.comments).toHaveLength(1);
      expect(firstPage.body.comments[0]).toHaveProperty('id', first.id);
      expect(firstPage.body).toHaveProperty('has_more', true);
      expect(typeof firstPage.body.next_cursor).toBe('string');

      const secondPage = await request(app)
        .get(`/comments/pins/${pin.id}/comments?limit=1&cursor=${encodeURIComponent(firstPage.body.next_cursor)}`);

      expect(secondPage.status).toBe(200);
      expect(secondPage.body.comments).toHaveLength(1);
      expect(secondPage.body.comments[0]).toHaveProperty('id', second.id);
      expect(secondPage.body).toHaveProperty('has_more', false);
      expect(secondPage.body).toHaveProperty('next_cursor', null);
    });

    it('should paginate by top-level comments while returning replies in the selected threads', async () => {
      const pin = await createTestPin();
      const first = await createTestComment(pin.id, 'First thread');
      const firstReply = await request(app)
        .post('/comments')
        .set('Cookie', [`access_token=${otherAccessToken}`])
        .send({
          pin_id: pin.id,
          parent_comment_id: first.id,
          content: 'Reply in first thread',
        });
      expect(firstReply.status).toBe(201);
      const second = await createTestComment(pin.id, 'Second thread');

      const firstPage = await request(app)
        .get(`/comments/pins/${pin.id}/comments?limit=1`);

      expect(firstPage.status).toBe(200);
      expect(firstPage.body.comments.map((comment: any) => comment.id)).toEqual([
        first.id,
        firstReply.body.id,
      ]);
      expect(firstPage.body).toHaveProperty('comment_count', 3);
      expect(firstPage.body).toHaveProperty('has_more', true);

      const secondPage = await request(app)
        .get(`/comments/pins/${pin.id}/comments?limit=1&cursor=${encodeURIComponent(firstPage.body.next_cursor)}`);

      expect(secondPage.status).toBe(200);
      expect(secondPage.body.comments.map((comment: any) => comment.id)).toEqual([
        second.id,
      ]);
      expect(secondPage.body).toHaveProperty('comment_count', 3);
      expect(secondPage.body).toHaveProperty('has_more', false);
    });

    it('should return 400 for malformed pin IDs', async () => {
      const res = await request(app).get('/comments/pins/not-a-pin/comments');

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Invalid pin ID');
    });
  });

  describe('POST & DELETE /comments/:id/like - Like/Unlike Comment', () => {
    it('should like a comment and increment likes_count', async () => {
      const pin = await createTestPin();
      const comment = await createTestComment(pin.id);

      const res = await request(app)
        .post(`/comments/${comment.id}/like`)
        .set('Cookie', [`access_token=${otherAccessToken}`]);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ liked: true, likes_count: 1 });
    });

    it('should unlike a comment and decrement likes_count', async () => {
      const pin = await createTestPin();
      const comment = await createTestComment(pin.id);

      await request(app)
        .post(`/comments/${comment.id}/like`)
        .set('Cookie', [`access_token=${otherAccessToken}`]);

      const res = await request(app)
        .delete(`/comments/${comment.id}/like`)
        .set('Cookie', [`access_token=${otherAccessToken}`]);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ liked: false, likes_count: 0 });
    });

    it('should return 404 when liking a missing comment', async () => {
      const res = await request(app)
        .post('/comments/999999/like')
        .set('Cookie', [`access_token=${ownerAccessToken}`]);

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'Comment not found');
    });
  });

  describe('DELETE /comments/:id - Delete Comment', () => {
    it('should prevent non-owners from deleting a comment', async () => {
      const pin = await createTestPin();
      const comment = await createTestComment(pin.id);

      const res = await request(app)
        .delete(`/comments/${comment.id}`)
        .set('Cookie', [`access_token=${otherAccessToken}`]);

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'Comment not found or not owned by user');
    });

    it('should allow the owner to delete a comment', async () => {
      const pin = await createTestPin();
      const comment = await createTestComment(pin.id);

      const res = await request(app)
        .delete(`/comments/${comment.id}`)
        .set('Cookie', [`access_token=${ownerAccessToken}`]);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ id: comment.id });

      const listRes = await request(app).get(`/comments/pins/${pin.id}/comments`);
      expect(listRes.body.comments.some((item: any) => item.id === comment.id)).toBe(false);
    });
  });
});
