import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { mockSupabaseDb } from './test.setup';

describe('Uploads API Endpoint Tests', () => {
  const mockUserId = 'usr_upload_tester_999';
  const mockAccessToken = 'access_upload_tester_jwt';
  const mockUserEmail = 'upload_tester@trail.com';

  function restoreEnv(name: string, value: string | undefined) {
    if (value == null) {
      delete process.env[name];
    } else {
      process.env[name] = value;
    }
  }

  beforeEach(() => {
    mockSupabaseDb.users.set(mockUserEmail, { id: mockUserId, email: mockUserEmail });
    mockSupabaseDb.sessions.set(mockAccessToken, {
      user: { id: mockUserId, email: mockUserEmail },
      expiresAt: Date.now() + 3600000
    });
  });

  describe('GET /uploads/cloudinary/signature - Generate Upload Signature', () => {
    it('should generate signature successfully for folder type "pins" when authenticated', async () => {
      const res = await request(app)
        .get('/uploads/cloudinary/signature')
        .set('Cookie', [`access_token=${mockAccessToken}`]);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('signature');
      expect(res.body).toHaveProperty('folder');
      expect(res.body.folder).toContain('pins');
      expect(res.body).toHaveProperty('cloudName');
      expect(res.body).toHaveProperty('apiKey');
    });

    it('should generate signature successfully for folder type "profiles" when authenticated', async () => {
      const res = await request(app)
        .get('/uploads/cloudinary/signature?folder=profiles')
        .set('Cookie', [`access_token=${mockAccessToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.folder).toContain('profiles');
    });

    it('should safely fall back to the pins folder for invalid folder values', async () => {
      const res = await request(app)
        .get('/uploads/cloudinary/signature?folder=../../profiles')
        .set('Cookie', [`access_token=${mockAccessToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.folder).toContain('pins');
      expect(res.body.folder).not.toContain('..');
    });

    it('should return 401 Unauthorized when unauthenticated', async () => {
      const res = await request(app).get('/uploads/cloudinary/signature');
      expect(res.status).toBe(401);
    });

    it('should return 500 when Cloudinary environment variables are missing (destructive test)', async () => {
      // 1. Back up env vars
      const backupCloudName = process.env.CLOUDINARY_CLOUD_NAME;
      const backupApiKey = process.env.CLOUDINARY_API_KEY;
      const backupApiSecret = process.env.CLOUDINARY_API_SECRET;

      // 2. Temporarily delete them
      delete process.env.CLOUDINARY_CLOUD_NAME;
      delete process.env.CLOUDINARY_API_KEY;
      delete process.env.CLOUDINARY_API_SECRET;

      try {
        const res = await request(app)
          .get('/uploads/cloudinary/signature')
          .set('Cookie', [`access_token=${mockAccessToken}`]);

        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty('error', 'Cloudinary env vars are missing');
      } finally {
        // 3. Restore env vars
        restoreEnv('CLOUDINARY_CLOUD_NAME', backupCloudName);
        restoreEnv('CLOUDINARY_API_KEY', backupApiKey);
        restoreEnv('CLOUDINARY_API_SECRET', backupApiSecret);
      }
    });
  });
});
