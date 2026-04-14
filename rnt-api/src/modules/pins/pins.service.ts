import { getPool } from '../../config/db';
import { CreatePinInput } from './pins.types';

export async function createPin(data: CreatePinInput) {
  const pool = getPool();

  const {
    title,
    category,
    description,
    image_url,
    thumbnail_url,
    image_urls,
    latitude,
    longitude,
    user_id,
  } = data;

  const resolvedThumbnail = thumbnail_url ?? image_url ?? null;
  const resolvedImages = image_urls && image_urls.length > 0
    ? image_urls
    : resolvedThumbnail
      ? [resolvedThumbnail]
      : [];

  const result = await pool.query(
    `
    INSERT INTO pins (
      title, category, description, image_url, thumbnail_url, image_urls, latitude, longitude, user_id, geom
    )
    VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9,
      ST_SetSRID(ST_MakePoint($8, $7), 4326)
    )
    RETURNING *;
    `,
    [
      title,
      category ?? 'general',
      description,
      resolvedThumbnail,
      resolvedThumbnail,
      resolvedImages,
      latitude,
      longitude,
      user_id,
    ]
  );

  return result.rows[0];
}

export async function deletePinById(id: string, userId: string) {
  const pool = getPool();

  const result = await pool.query(
    `
    DELETE FROM pins
    WHERE id = $1 AND user_id = $2
    RETURNING id;
    `,
    [id, userId]
  );

  return result.rows[0] ?? null;
}
