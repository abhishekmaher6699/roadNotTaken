import { describe, expect, it, vi } from "vitest";
import {
  clearAuthCookies,
  getAccessTokenFromRequest,
  setAuthCookies,
} from "../../../src/modules/auth/auth.cookies";

describe("auth.cookies", () => {
  it("prefers the Authorization header over cookies", () => {
    const token = getAccessTokenFromRequest({
      headers: {
        authorization: "Bearer header-token",
        cookie: "access_token=cookie-token",
      },
    } as any);

    expect(token).toBe("header-token");
  });

  it("falls back to the access_token cookie", () => {
    const token = getAccessTokenFromRequest({
      headers: {
        cookie: "other=value; access_token=cookie-token",
      },
    } as any);

    expect(token).toBe("cookie-token");
  });

  it("returns null when no auth token is provided", () => {
    expect(getAccessTokenFromRequest({ headers: {} } as any)).toBeNull();
  });

  it("writes auth cookies with the expected options", () => {
    const cookie = vi.fn();

    setAuthCookies({ cookie } as any, "access-token", "refresh-token");

    expect(cookie).toHaveBeenNthCalledWith(
      1,
      "access_token",
      "access-token",
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      })
    );
    expect(cookie).toHaveBeenNthCalledWith(
      2,
      "refresh_token",
      "refresh-token",
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      })
    );
  });

  it("clears both auth cookies", () => {
    const clearCookie = vi.fn();

    clearAuthCookies({ clearCookie } as any);

    expect(clearCookie).toHaveBeenCalledWith(
      "access_token",
      expect.objectContaining({ httpOnly: true, path: "/" })
    );
    expect(clearCookie).toHaveBeenCalledWith(
      "refresh_token",
      expect.objectContaining({ httpOnly: true, path: "/" })
    );
  });
});
