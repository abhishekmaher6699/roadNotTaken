import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import app from '../../../src/app';
import * as supabaseConfig from '../../../src/config/supabase';

vi.mock('../../../src/config/supabase', () => ({
  getSupabaseClient: vi.fn(),
}));

describe('Uploads Routes', () => {
  const originalEnv = process.env;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    (supabaseConfig.getSupabaseClient as any).mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'mock-user' } } }) },
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    process.env = originalEnv;
  });

  describe('GET /uploads/cloudinary/signature', () => {
    it('returns 401 if unauthenticated', async () => {
      const res = await request(app).get('/uploads/cloudinary/signature');
      expect(res.status).toBe(401);
    });

    it('returns 500 if environment variables are missing', async () => {
      delete process.env.CLOUDINARY_CLOUD_NAME;
      const res = await request(app)
        .get('/uploads/cloudinary/signature')
        .set('Authorization', 'Bearer mock');
        
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Cloudinary env vars are missing');
    });

    it('returns 401 when auth middleware rejects the token', async () => {
      (supabaseConfig.getSupabaseClient as any).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: { message: 'Invalid token' },
          }),
        },
      });

      const res = await request(app)
        .get('/uploads/cloudinary/signature')
        .set('Authorization', 'Bearer bad-token');

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid token');
    });

    it('returns a valid signature payload if authenticated', async () => {
      process.env.CLOUDINARY_CLOUD_NAME = 'mock-cloud';
      process.env.CLOUDINARY_API_KEY = 'mock-key';
      process.env.CLOUDINARY_API_SECRET = 'mock-secret';
      process.env.CLOUDINARY_UPLOAD_FOLDER = 'custom-folder';

      const res = await request(app)
        .get('/uploads/cloudinary/signature')
        .set('Authorization', 'Bearer mock');
        
      expect(res.status).toBe(200);
      expect(res.body.cloudName).toBe('mock-cloud');
      expect(res.body.apiKey).toBe('mock-key');
      expect(res.body.folder).toBe('custom-folder');
      expect(res.body.signature).toBeTypeOf('string');
      expect(res.body.timestamp).toBeTypeOf('number');
    });
  });
});
