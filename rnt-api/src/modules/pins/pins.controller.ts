import { Request, Response } from 'express';
import { createPin, deletePinById, updatePinById } from './pins.service';
import { getPool } from '../../config/db';

export async function createPinHandler(req: any, res: any) {
  try {
    const user = req.user;

    const pin = await createPin({
      ...req.body,
      user_id: user.id,
      posted_by: user.email ?? req.body.posted_by,
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
        user_id,
        posted_by,
        latitude,
        longitude,
        title,
        category,
        address,
        status,
        access_level,
        description,
        COALESCE(thumbnail_url, image_url) AS thumbnail_url,
        image_urls,
        created_at,
        updated_at
      FROM pins
      ORDER BY created_at DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch pins' });
  }
}

export async function deletePinHandler(req: any, res: Response) {
  try {
    const user = req.user;
    const pinId = req.params.id;

    const deletedPin = await deletePinById(pinId, user.id);

    if (!deletedPin) {
      return res.status(404).json({ error: 'Pin not found or not owned by user' });
    }

    return res.status(200).json({ id: deletedPin.id });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete pin' });
  }
}

export async function updatePinHandler(req: any, res: Response) {
  try {
    const user = req.user;
    const pinId = req.params.id;

    const updatedPin = await updatePinById(pinId, user.id, req.body);

    if (!updatedPin) {
      return res.status(404).json({ error: 'Pin not found or not owned by user' });
    }

    return res.status(200).json(updatedPin);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update pin' });
  }
}
