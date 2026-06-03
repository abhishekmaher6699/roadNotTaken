import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { mockSupabaseDb } from './test.setup';

// Helper to extract cookies from response headers
function parseSetCookies(headers: Record<string, any>): Record<string, string> {
  const cookieHeaders: string[] = headers['set-cookie'] || [];
  const parsed: Record<string, string> = {};
  cookieHeaders.forEach((cookieStr) => {
    const parts = cookieStr.split(';')[0].split('=');
    if (parts[0]) {
      parsed[parts[0].trim()] = decodeURIComponent(parts[1] || '');
    }
  });
  return parsed;
}

describe('Authentication API Endpoint Tests', () => {
  beforeEach(() => {
    mockSupabaseDb.reset();
  });

  describe('POST /auth/signup - User Registration', () => {
    it('should successfully register a new user and set auth cookies', async () => {
      const res = await request(app)
        .post('/auth/signup')
        .send({ email: 'explorer@forest.com', password: 'securePassword123' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('message', 'User created');
      expect(res.body.user).toHaveProperty('email', 'explorer@forest.com');
      expect(res.body.user).toHaveProperty('id');

      // Verify cookies are set
      const cookies = parseSetCookies(res.headers);
      expect(cookies).toHaveProperty('access_token');
      expect(cookies).toHaveProperty('refresh_token');
      expect(cookies.access_token).toMatch(/^access_/);
      expect(cookies.refresh_token).toMatch(/^refresh_/);
    });

    it('should fail registration when email is missing', async () => {
      const res = await request(app)
        .post('/auth/signup')
        .send({ password: 'securePassword123' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Email and password required');
    });

    it('should fail registration when password is missing', async () => {
      const res = await request(app)
        .post('/auth/signup')
        .send({ email: 'explorer@forest.com' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Email and password required');
    });

    it('should fail registration when empty body is sent', async () => {
      const res = await request(app)
        .post('/auth/signup')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Email and password required');
    });

    it('should fail registration for an already registered email (duplicate user)', async () => {
      // Seed user directly into mock database
      mockSupabaseDb.users.set('explorer@forest.com', {
        id: 'usr_existing',
        email: 'explorer@forest.com',
        password: 'anotherPassword'
      });

      const res = await request(app)
        .post('/auth/signup')
        .send({ email: 'explorer@forest.com', password: 'securePassword123' });

      expect(res.status).toBe(409);
      expect(res.body).toHaveProperty('error', 'User already exists');
    });

    it('should handle malformed email/password formats gracefully', async () => {
      const res = await request(app)
        .post('/auth/signup')
        .send({ email: ['not-an-email'], password: { key: 'object' } });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Email and password must be strings');
    });
  });

  describe('POST /auth/login - User Login', () => {
    beforeEach(() => {
      // Register a default user for login tests
      mockSupabaseDb.users.set('test@trail.com', {
        id: 'usr_test_trail',
        email: 'test@trail.com',
        password: 'correctPassword'
      });
    });

    it('should log in with valid credentials and return access cookies', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'test@trail.com', password: 'correctPassword' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Login successful');
      expect(res.body.user).toHaveProperty('email', 'test@trail.com');

      const cookies = parseSetCookies(res.headers);
      expect(cookies).toHaveProperty('access_token');
      expect(cookies).toHaveProperty('refresh_token');
    });

    it('should fail login when providing incorrect password', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'test@trail.com', password: 'wrongPassword' });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error', 'Invalid login credentials');

      const cookies = parseSetCookies(res.headers);
      expect(cookies).not.toHaveProperty('access_token');
    });

    it('should fail login when user does not exist', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'unknown@trail.com', password: 'correctPassword' });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error', 'Invalid login credentials');
    });

    it('should return 400 when missing email/password fields', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'test@trail.com' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Email and password required');
    });
  });

  describe('POST /auth/session - Exchange Session Tokens', () => {
    it('should create session cookies and verify user when provided valid supabase tokens', async () => {
      const mockUser = { id: 'usr_token_exchange', email: 'token@exchange.com' };
      mockSupabaseDb.users.set('token@exchange.com', mockUser);
      mockSupabaseDb.sessions.set('access_exchange_123', {
        user: mockUser,
        refreshToken: 'refresh_exchange_123',
        expiresAt: Date.now() + 3600000
      });

      const res = await request(app)
        .post('/auth/session')
        .send({ access_token: 'access_exchange_123', refresh_token: 'refresh_exchange_123' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Session created');
      expect(res.body.user).toHaveProperty('email', 'token@exchange.com');

      const cookies = parseSetCookies(res.headers);
      expect(cookies).toHaveProperty('access_token', 'access_exchange_123');
      expect(cookies).toHaveProperty('refresh_token', 'refresh_exchange_123');
    });

    it('should return 400 if access_token is missing', async () => {
      const res = await request(app)
        .post('/auth/session')
        .send({ refresh_token: 'refresh_exchange_123' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Access token required');
    });

    it('should return 401 if access_token is invalid', async () => {
      const res = await request(app)
        .post('/auth/session')
        .send({ access_token: 'invalid_access_token' });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error', 'Invalid token');
    });
  });

  describe('POST /auth/refresh - Refresh Expiry Tokens', () => {
    it('should refresh tokens and issue new cookies when cookie contains valid refresh_token', async () => {
      const mockUser = { id: 'usr_refresh_user', email: 'refresh@token.com' };
      mockSupabaseDb.users.set('refresh@token.com', mockUser);
      
      const oldAccessToken = 'access_old_999';
      const oldRefreshToken = 'refresh_old_999';
      
      mockSupabaseDb.sessions.set(oldAccessToken, {
        user: mockUser,
        refreshToken: oldRefreshToken,
        expiresAt: Date.now() + 3600000
      });
      mockSupabaseDb.refreshTokens.set(oldRefreshToken, {
        user: mockUser,
        accessToken: oldAccessToken,
        expiresAt: Date.now() + 30 * 24 * 3600000
      });

      const res = await request(app)
        .post('/auth/refresh')
        .set('Cookie', [`refresh_token=${oldRefreshToken}`]);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Token refreshed');

      const cookies = parseSetCookies(res.headers);
      expect(cookies).toHaveProperty('access_token');
      expect(cookies).toHaveProperty('refresh_token');
      expect(cookies.access_token).not.toBe(oldAccessToken);
      expect(cookies.refresh_token).not.toBe(oldRefreshToken);
    });

    it('should return 401 and clear cookies if no refresh token is provided', async () => {
      const res = await request(app)
        .post('/auth/refresh');

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error', 'No refresh token available');

      // Check that cookies were cleared (maxAge=0 or cleared headers)
      const cookieHeader = res.headers['set-cookie'] || [];
      expect(cookieHeader.some((c: string) => c.includes('access_token=;'))).toBe(true);
      expect(cookieHeader.some((c: string) => c.includes('refresh_token=;'))).toBe(true);
    });

    it('should return 401 and clear cookies if refresh token is invalid/expired', async () => {
      const res = await request(app)
        .post('/auth/refresh')
        .set('Cookie', ['refresh_token=invalid_refresh_token']);

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error', 'Invalid refresh token');

      const cookieHeader = res.headers['set-cookie'] || [];
      expect(cookieHeader.some((c: string) => c.includes('access_token=;'))).toBe(true);
    });
  });

  describe('POST /auth/logout - Sign Out', () => {
    it('should log out successfully and clear cookies when authenticated', async () => {
      const mockUser = { id: 'usr_logout_user', email: 'logout@token.com' };
      const token = 'access_logout_111';
      mockSupabaseDb.sessions.set(token, {
        user: mockUser,
        refreshToken: 'refresh_logout_111',
        expiresAt: Date.now() + 3600000
      });

      const res = await request(app)
        .post('/auth/logout')
        .set('Cookie', [`access_token=${token}`]);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Logout successful');

      // Verify cookies are cleared
      const cookieHeader = res.headers['set-cookie'] || [];
      expect(cookieHeader.some((c: string) => c.includes('access_token=;'))).toBe(true);
      expect(cookieHeader.some((c: string) => c.includes('refresh_token=;'))).toBe(true);
    });

    it('should return 401 Unauthorized if no session cookie is supplied', async () => {
      const res = await request(app)
        .post('/auth/logout');

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error', 'No token provided');
    });

    it('should return 401 if invalid session token is supplied', async () => {
      const res = await request(app)
        .post('/auth/logout')
        .set('Cookie', ['access_token=invalid_access_token']);

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error', 'Invalid token');
    });
  });

  describe('GET /auth/me - Current User Info', () => {
    it('should return current user info when authenticated via access token cookie', async () => {
      const mockUser = { id: 'usr_me_cookie', email: 'me_cookie@token.com' };
      const token = 'access_me_222';
      mockSupabaseDb.sessions.set(token, {
        user: mockUser,
        expiresAt: Date.now() + 3600000
      });

      const res = await request(app)
        .get('/auth/me')
        .set('Cookie', [`access_token=${token}`]);

      expect(res.status).toBe(200);
      expect(res.body.user).toHaveProperty('email', 'me_cookie@token.com');
      expect(res.body.user).toHaveProperty('id', 'usr_me_cookie');
    });

    it('should return current user info when authenticated via Authorization header', async () => {
      const mockUser = { id: 'usr_me_header', email: 'me_header@token.com' };
      const token = 'access_me_333';
      mockSupabaseDb.sessions.set(token, {
        user: mockUser,
        expiresAt: Date.now() + 3600000
      });

      const res = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.user).toHaveProperty('email', 'me_header@token.com');
    });

    it('should return 401 if token is expired', async () => {
      const mockUser = { id: 'usr_me_expired', email: 'me_expired@token.com' };
      const token = 'access_me_expired';
      mockSupabaseDb.sessions.set(token, {
        user: mockUser,
        expiresAt: Date.now() - 1000 // Expired 1 second ago
      });

      const res = await request(app)
        .get('/auth/me')
        .set('Cookie', [`access_token=${token}`]);

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error', 'Invalid token');
    });

    it('should return 401 if unauthenticated', async () => {
      const res = await request(app)
        .get('/auth/me');

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error', 'No token provided');
    });
  });
});
