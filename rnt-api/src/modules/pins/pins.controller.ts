import { Request, Response } from 'express';
import { createPin } from './pins.service';
import { getPool } from '../../config/db';

export async function createPinHandler(req: any, res: any) {
  try {

    const user = req.user;

    const pin = await createPin({
        ...req.body,
        user_id: user.id,
    });
    res.status(201).json(pin);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create pin' });
  }
}



export async function getPinsHandler(req: Request, res: Response) {
  try {
    const pool = getPool();

    const result = await pool.query(`
      SELECT
        id,
        latitude,
        longitude,
        title,
        description,
        COALESCE(thumbnail_url, image_url) AS thumbnail_url,
        image_urls
      FROM pins
      ORDER BY created_at DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch pins' });
  }
}
