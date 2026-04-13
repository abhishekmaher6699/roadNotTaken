import { Request, Response } from 'express';
import { clearAuthCookies, getAccessTokenFromRequest, setAuthCookies } from './auth.cookies';
import {
  getGoogleAuthUrl,
  getUserFromAccessToken,
  signupUser,
  loginUser,
  logoutUser,
} from './auth.service';

export async function signupHandler(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    await signupUser(email, password);
    const data = await loginUser(email, password);

    if (!data.session?.access_token) {
      throw new Error("Signup session was not created");
    }

    setAuthCookies(
      res,
      data.session.access_token,
      data.session.refresh_token ?? undefined
    );

    res.status(201).json({
      message: 'User created',
      user: data.user,
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}



export async function loginHandler(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    const data = await loginUser(email, password);

    if (!data.session?.access_token) {
      throw new Error("Login session was not created");
    }

    setAuthCookies(
      res,
      data.session.access_token,
      data.session.refresh_token ?? undefined
    );

    res.json({
      message: 'Login successful',
      user: data.user,
    });
  } catch (err: any) {
    console.error(err);
    res.status(401).json({ error: err.message });
  }
}

export function googleAuthUrlHandler(req: Request, res: Response) {
  try {
    const url = getGoogleAuthUrl();
    res.json({ url });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

export function currentUserHandler(req: any, res: Response) {
  res.json({ user: req.user });
}

export async function createSessionHandler(req: Request, res: Response) {
  try {
    const { access_token: accessToken, refresh_token: refreshToken } = req.body;

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
