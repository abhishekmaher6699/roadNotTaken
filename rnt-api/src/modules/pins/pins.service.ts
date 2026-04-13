import { getPool } from '../../config/db';
import { CreatePinInput } from './pins.types';

export async function createPin(data: CreatePinInput) {
  const pool = getPool();

  const { title, description, image_url, latitude, longitude, user_id } = data;

  const result = await pool.query(
    `
    INSERT INTO pins (
      title, description, image_url, latitude, longitude, user_id, geom
    )
    VALUES (
      $1, $2, $3, $4, $5, $6,
      ST_SetSRID(ST_MakePoint($5, $4), 4326)
    )
    RETURNING *;
    `,
    [title, description, image_url, latitude, longitude, user_id]
  );

  return result.rows[0];
}