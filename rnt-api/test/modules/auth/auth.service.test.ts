import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as supabaseConfig from "../../../src/config/supabase";
import {
  getGoogleAuthUrl,
  getUserFromAccessToken,
  loginUser,
  logoutUser,
  signupUser,
} from "../../../src/modules/auth/auth.service";

vi.mock("../../../src/config/supabase", () => ({
  getSupabaseClient: vi.fn(),
}));

describe("auth.service", () => {
  const originalEnv = process.env;
  let mockSupabase: any;

  beforeEach(() => {
    process.env = { ...originalEnv };
    mockSupabase = {
      auth: {
        admin: {
          createUser: vi.fn(),
          signOut: vi.fn(),
        },
        signInWithPassword: vi.fn(),
        getUser: vi.fn(),
      },
    };
    (supabaseConfig.getSupabaseClient as any).mockReturnValue(mockSupabase);
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  it("creates a confirmed user", async () => {
    mockSupabase.auth.admin.createUser.mockResolvedValueOnce({
      data: { user: { id: "1" } },
      error: null,
    });

    await expect(signupUser("test@test.com", "password123")).resolves.toEqual({
      id: "1",
    });
  });

  it("throws when signup fails", async () => {
    mockSupabase.auth.admin.createUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: "signup failed" },
    });

    await expect(signupUser("test@test.com", "password123")).rejects.toThrow(
      "signup failed"
    );
  });

  it("returns the session payload when login succeeds", async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: { id: "1" }, session: { access_token: "token" } },
      error: null,
    });

    const session = await loginUser("test@test.com", "password123");

    expect(session.session?.access_token).toBe("token");
  });

  it("throws when an access token is invalid", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: "bad token" },
    });

    await expect(getUserFromAccessToken("bad-token")).rejects.toThrow(
      "Invalid token"
    );
  });

  it("throws when logout fails", async () => {
    mockSupabase.auth.admin.signOut.mockResolvedValueOnce({
      error: { message: "signout failed" },
    });

    await expect(logoutUser("access-token")).rejects.toThrow("signout failed");
  });

  it("builds the Google auth url with the default callback origin", () => {
    process.env.SUPABASE_URL = "https://example.supabase.co";

    const url = new URL(getGoogleAuthUrl());

    expect(url.origin).toBe("https://example.supabase.co");
    expect(url.pathname).toBe("/auth/v1/authorize");
    expect(url.searchParams.get("provider")).toBe("google");
    expect(url.searchParams.get("redirect_to")).toBe(
      "http://localhost:3000/auth/callback"
    );
  });

  it("uses WEB_URL when building the Google callback url", () => {
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.WEB_URL = "https://roadnottaken.app";

    const url = new URL(getGoogleAuthUrl());

    expect(url.searchParams.get("redirect_to")).toBe(
      "https://roadnottaken.app/auth/callback"
    );
  });
});
