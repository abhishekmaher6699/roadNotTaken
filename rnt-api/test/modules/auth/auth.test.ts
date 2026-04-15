import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import app from '../../../src/app';
import * as supabaseConfig from '../../../src/config/supabase';

vi.mock('../../../src/config/supabase', () => ({
  getSupabaseClient: vi.fn(),
}));

describe('Auth Routes', () => {
  let mockSupabase: any;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    mockSupabase = {
      auth: {
        admin: {
          createUser: vi.fn(),
          signOut: vi.fn(),
        },
        signInWithPassword: vi.fn(),
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'mock-user', email: 'test@test.com' } },
          error: null,
        }),
      },
    };

    (supabaseConfig.getSupabaseClient as any).mockReturnValue(mockSupabase);
    process.env.SUPABASE_URL = 'http://mock-supabase.com';
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('POST /auth/signup', () => {
    it('requires email and password', async () => {
      const res = await request(app).post('/auth/signup').send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Email and password required');
    });

    it('creates a user and logs them in', async () => {
      mockSupabase.auth.admin.createUser.mockResolvedValueOnce({
        data: { user: { id: '1', email: 'test@test.com' } },
        error: null,
      });
      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: {
          user: { id: '1' },
          session: { access_token: 'mock-token', refresh_token: 'refresh-token' },
        },
        error: null,
      });

      const res = await request(app)
        .post('/auth/signup')
        .send({ email: 'test@test.com', password: 'password123' });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('User created');
      expect(res.headers['set-cookie']).toEqual(
        expect.arrayContaining([
          expect.stringContaining('access_token=mock-token'),
          expect.stringContaining('refresh_token=refresh-token'),
        ])
      );
    });

    it('returns 500 when signup succeeds but no session is returned', async () => {
      mockSupabase.auth.admin.createUser.mockResolvedValueOnce({
        data: { user: { id: '1', email: 'test@test.com' } },
        error: null,
      });
      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: { id: '1' }, session: null },
        error: null,
      });

      const res = await request(app)
        .post('/auth/signup')
        .send({ email: 'test@test.com', password: 'password123' });

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Signup session was not created');
    });
  });

  describe('POST /auth/login', () => {
    it('requires email and password', async () => {
      const res = await request(app).post('/auth/login').send({ email: 'test@test.com' });
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Email and password required');
    });

    it('returns 401 on invalid credentials', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
        error: { message: 'Invalid login credentials' },
      });

      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'test@test.com', password: 'wrong' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid login credentials');
    });

    it('stores both access and refresh tokens when login succeeds', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: {
          user: { id: '1', email: 'test@test.com' },
          session: { access_token: 'mock-token', refresh_token: 'refresh-token' },
        },
        error: null,
      });

      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'test@test.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Login successful');
      expect(res.headers['set-cookie']).toEqual(
        expect.arrayContaining([
          expect.stringContaining('access_token=mock-token'),
          expect.stringContaining('refresh_token=refresh-token'),
        ])
      );
    });
  });

  describe('POST /auth/session', () => {
    it('requires an access token', async () => {
      const res = await request(app).post('/auth/session').send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Access token required');
    });

    it('creates a cookie-backed session from oauth tokens', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'oauth-user', email: 'oauth@test.com' } },
        error: null,
      });

      const res = await request(app)
        .post('/auth/session')
        .send({ access_token: 'oauth-access', refresh_token: 'oauth-refresh' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        message: 'Session created',
        user: { id: 'oauth-user', email: 'oauth@test.com' },
      });
      expect(res.headers['set-cookie']).toEqual(
        expect.arrayContaining([
          expect.stringContaining('access_token=oauth-access'),
          expect.stringContaining('refresh_token=oauth-refresh'),
        ])
      );
    });
  });

  describe('GET /auth/me', () => {
    it('returns 401 if no cookies/token provided', async () => {
      const res = await request(app).get('/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('No token provided');
    });

    it('returns user profile if token is valid', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: '123', email: 'test@test.com' } },
        error: null,
      });

      const res = await request(app)
        .get('/auth/me')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('test@test.com');
    });

    it('returns 401 when the token is invalid', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Invalid token' },
      });

      const res = await request(app)
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid token');
    });
  });

  describe('POST /auth/logout', () => {
    it('logs the user out and clears auth cookies', async () => {
      mockSupabase.auth.admin.signOut.mockResolvedValueOnce({ error: null });

      const res = await request(app)
        .post('/auth/logout')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: 'Logout successful' });
      expect(mockSupabase.auth.admin.signOut).toHaveBeenCalledWith('valid-token');
      expect(res.headers['set-cookie']).toEqual(
        expect.arrayContaining([
          expect.stringContaining('access_token=;'),
          expect.stringContaining('refresh_token=;'),
        ])
      );
    });
  });

  describe('GET /auth/google/url', () => {
    it('returns the oauth url', async () => {
      const res = await request(app).get('/auth/google/url');
      expect(res.status).toBe(200);
      expect(res.body.url).toContain('mock-supabase.com');
    });

    it('returns 500 when SUPABASE_URL is missing', async () => {
      delete process.env.SUPABASE_URL;

      const res = await request(app).get('/auth/google/url');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('SUPABASE_URL is not defined');
    });
  });
});
