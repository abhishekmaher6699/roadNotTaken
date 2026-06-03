import dotenv from 'dotenv';
dotenv.config();

import { vi, beforeEach, afterAll } from 'vitest';
import { getPool } from '../src/config/db';



export const mockSupabaseDb = {
  users: new Map<string, any>(),
  sessions: new Map<string, any>(),
  refreshTokens: new Map<string, any>(),
  reset() {
    this.users.clear();
    this.sessions.clear();
    this.refreshTokens.clear();
  }
};

// Global reset before each test
beforeEach(() => {
  mockSupabaseDb.reset();
});

// Mock Supabase globally
vi.mock('../src/config/supabase', () => {
  return {
    getSupabaseClient: () => {
      return {
        auth: {
          admin: {
            createUser: async (options: any) => {
              const { email, password, email_confirm } = options;
              if (typeof email !== 'string' || typeof password !== 'string') {
                return {
                  data: { user: null },
                  error: { message: 'Invalid API parameters: email and password must be strings' }
                };
              }
              if (mockSupabaseDb.users.has(email)) {
                return {
                  data: { user: null },
                  error: { message: 'User already exists' }
                };
              }
              const user = {
                id: `usr_${Math.random().toString(36).slice(2, 11)}`,
                email,
                confirmed_at: email_confirm ? new Date().toISOString() : null,
              };
              mockSupabaseDb.users.set(email, { ...user, password });
              return { data: { user }, error: null };
            },
            signOut: async (token: string) => {
              const session = mockSupabaseDb.sessions.get(token);
              if (!session) {
                return { error: { message: 'Session not found' } };
              }
              mockSupabaseDb.sessions.delete(token);
              if (session.refreshToken) {
                mockSupabaseDb.refreshTokens.delete(session.refreshToken);
              }
              return { error: null };
            }
          },
          signInWithPassword: async (credentials: any) => {
            const { email, password } = credentials;
            if (typeof email !== 'string' || typeof password !== 'string') {
              return {
                data: { session: null, user: null },
                error: { message: 'Invalid login credentials' }
              };
            }
            const user = mockSupabaseDb.users.get(email);
            if (!user || user.password !== password) {
              return {
                data: { session: null, user: null },
                error: { message: 'Invalid login credentials' }
              };
            }
            const accessToken = `access_${Math.random().toString(36).slice(2, 11)}`;
            const refreshToken = `refresh_${Math.random().toString(36).slice(2, 11)}`;
            const session = {
              access_token: accessToken,
              refresh_token: refreshToken,
              expires_in: 3600,
            };
            mockSupabaseDb.sessions.set(accessToken, {
              user,
              refreshToken,
              expiresAt: Date.now() + 3600000
            });
            mockSupabaseDb.refreshTokens.set(refreshToken, {
              user,
              accessToken,
              expiresAt: Date.now() + 30 * 24 * 3600000
            });
            return { data: { session, user }, error: null };
          },
          getUser: async (token: string) => {
            const session = mockSupabaseDb.sessions.get(token);
            if (!session || Date.now() > session.expiresAt) {
              return {
                data: { user: null },
                error: { message: 'Invalid token' }
              };
            }
            return { data: { user: session.user }, error: null };
          },
          refreshSession: async (options: any) => {
            const { refresh_token } = options;
            const stored = mockSupabaseDb.refreshTokens.get(refresh_token);
            if (!stored || Date.now() > stored.expiresAt) {
              return {
                data: { session: null, user: null },
                error: { message: 'Invalid refresh token' }
              };
            }
            const newAccessToken = `access_${Math.random().toString(36).slice(2, 11)}`;
            const newRefreshToken = `refresh_${Math.random().toString(36).slice(2, 11)}`;
            const session = {
              access_token: newAccessToken,
              refresh_token: newRefreshToken,
              expires_in: 3600,
            };
            
            // Clean up old
            mockSupabaseDb.sessions.delete(stored.accessToken);
            mockSupabaseDb.refreshTokens.delete(refresh_token);

            // Add new
            mockSupabaseDb.sessions.set(newAccessToken, {
              user: stored.user,
              refreshToken: newRefreshToken,
              expiresAt: Date.now() + 3600000
            });
            mockSupabaseDb.refreshTokens.set(newRefreshToken, {
              user: stored.user,
              accessToken: newAccessToken,
              expiresAt: Date.now() + 30 * 24 * 3600000
            });

            return { data: { session, user: stored.user }, error: null };
          }
        }
      };
    }
  };
});

afterAll(async () => {
  try {
    const pool = getPool();
    await pool.end();
  } catch (err) {
    // Ignore error if database pool wasn't initialized or set up
  }
});

