import { Request, Response } from "express";

const ACCESS_TOKEN_COOKIE = "access_token";
const REFRESH_TOKEN_COOKIE = "refresh_token";

const isProduction = process.env.NODE_ENV === "production";

function parseCookies(req: Request) {
  const rawCookie = req.headers.cookie;

  if (!rawCookie) {
    return {};
  }

  return rawCookie.split(";").reduce<Record<string, string>>((cookies, part) => {
    const [key, ...valueParts] = part.trim().split("=");

    if (!key) {
      return cookies;
    }

    cookies[key] = decodeURIComponent(valueParts.join("="));
    return cookies;
  }, {});
}

export function getAccessTokenFromRequest(req: Request) {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1];
    if (token) {
      return token;
    }
  }

  return parseCookies(req)[ACCESS_TOKEN_COOKIE] ?? null;
}

export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken?: string
) {
  res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 1000 * 60 * 60,
  });

  if (refreshToken) {
    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 1000 * 60 * 60 * 24 * 30,
    });
  }
}

export function clearAuthCookies(res: Response) {
  res.clearCookie(ACCESS_TOKEN_COOKIE, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
  });

  res.clearCookie(REFRESH_TOKEN_COOKIE, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
  });
}
