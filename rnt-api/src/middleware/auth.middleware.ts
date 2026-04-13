import { Request, Response, NextFunction } from 'express';
import { getSupabaseClient } from '../config/supabase';
import { getAccessTokenFromRequest } from '../modules/auth/auth.cookies';


export async function authMiddleware(req: any, res: Response, next: NextFunction) {
  
  try {
    const token = getAccessTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = data.user;
    req.accessToken = token;

    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: 'Unauthorized' });
  }
}
