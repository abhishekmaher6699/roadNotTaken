import { Request, Response } from 'express';
import { signupUser, loginUser } from './auth.service';

export async function signupHandler(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await signupUser(email, password);

    res.status(201).json({
      message: 'User created',
      user,
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

    res.json({
      message: 'Login successful',
      session: data.session,
      user: data.user,
    });
  } catch (err: any) {
    console.error(err);
    res.status(401).json({ error: err.message });
  }
}