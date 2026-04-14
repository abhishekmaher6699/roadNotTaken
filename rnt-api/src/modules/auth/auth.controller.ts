import { Request, Response } from 'express';
import { clearAuthCookies, getAccessTokenFromRequest, setAuthCookies } from './auth.cookies';
import {
  getGoogleAuthUrl,
  getUserFromAccessToken,
  type AuthSessionResult,
  signupUser,
  loginUser,
  logoutUser,
} from './auth.service';

type AuthBody = {
  email?: string;
  password?: string;
};

type SessionBody = {
  access_token?: string;
  refresh_token?: string;
};

// Validates the shared email/password payload used by login and signup.
function getCredentials(body: AuthBody) {
  const { email, password } = body;

  if (!email || !password) {
    throw new Error('Email and password required');
  }

  return { email, password };
}

// Persists the Supabase session in secure cookies after a successful auth flow.
function setSessionCookiesFromAuthResult(
  res: Response,
  session: AuthSessionResult,
  missingSessionMessage: string
) {
  if (!session.session?.access_token) {
    throw new Error(missingSessionMessage);
  }

  setAuthCookies(
    res,
    session.session.access_token,
    session.session.refresh_token ?? undefined
  );
}

// Creates the user, then signs them in immediately so the server can set cookies.
export async function signupHandler(req: Request, res: Response) {
  try {
    const { email, password } = getCredentials(req.body as AuthBody);

    await signupUser(email, password);
    const session = await loginUser(email, password);
    setSessionCookiesFromAuthResult(res, session, "Signup session was not created");

    res.status(201).json({
      message: 'User created',
      user: session.user,
    });
  } catch (err: any) {
    console.error(err);
    res.status(err.message === 'Email and password required' ? 400 : 500).json({
      error: err.message,
    });
  }
}



// Signs in with email/password and stores the resulting session in cookies.
export async function loginHandler(req: Request, res: Response) {
  try {
    const { email, password } = getCredentials(req.body as AuthBody);
    const session = await loginUser(email, password);
    setSessionCookiesFromAuthResult(res, session, "Login session was not created");

    res.json({
      message: 'Login successful',
      user: session.user,
    });
  } catch (err: any) {
    console.error(err);
    res.status(401).json({ error: err.message });
  }
}

// Returns the backend-generated Google OAuth URL so the client stays provider-agnostic.
export function googleAuthUrlHandler(req: Request, res: Response) {
  try {
    const url = getGoogleAuthUrl();
    res.json({ url });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

// Returns the authenticated user that authMiddleware attached to the request.
export function currentUserHandler(req: any, res: Response) {
  res.json({ user: req.user });
}

// Exchanges OAuth tokens from the callback page for the server-managed cookie session.
export async function createSessionHandler(req: Request, res: Response) {
  try {
    const {
      access_token: accessToken,
      refresh_token: refreshToken,
    } = req.body as SessionBody;

    if (!accessToken) {
      return res.status(400).json({ error: "Access token required" });
    }

    const user = await getUserFromAccessToken(accessToken);
    setAuthCookies(res, accessToken, refreshToken);

    res.json({
      message: "Session created",
      user,
    });
  } catch (err: any) {
    console.error(err);
    res.status(401).json({ error: err.message });
  }
}

// Revokes the current session and clears auth cookies even if revocation fails.
export async function logoutHandler(req: Request, res: Response) {
  try {
    const token = getAccessTokenFromRequest(req);

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    await logoutUser(token);
    clearAuthCookies(res);
    res.json({ message: 'Logout successful' });
  } catch (err: any) {
    console.error(err);
    clearAuthCookies(res);
    res.status(500).json({ error: err.message });
  }
}
