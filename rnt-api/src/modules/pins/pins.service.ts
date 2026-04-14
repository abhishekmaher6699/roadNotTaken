import { getPool } from '../../config/db';
import { CreatePinInput, UpdatePinInput } from './pins.types';

export async function createPin(data: CreatePinInput) {
  const pool = getPool();

  const {
    title,
    category,
    address,
    status,
    posted_by,
    access_level,
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
      title, category, address, status, posted_by, access_level, description, image_url, thumbnail_url, image_urls, latitude, longitude, user_id, geom
    )
    VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
      ST_SetSRID(ST_MakePoint($12, $11), 4326)
    )
    RETURNING *;
    `,
    [
      title,
      category ?? 'general',
      address ?? null,
      status ?? 'active',
      posted_by ?? null,
      access_level ?? 'public',
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

export async function updatePinById(
  id: string,
  userId: string,
  data: UpdatePinInput
) {
  const pool = getPool();

  const {
    title,
    category,
    address,
    status,
    access_level,
    description,
    image_url,
    thumbnail_url,
    image_urls,
  } = data;

  const resolvedThumbnail = thumbnail_url ?? image_url ?? null;
  const resolvedImages =
    image_urls && image_urls.length > 0
      ? image_urls
      : resolvedThumbnail
        ? [resolvedThumbnail]
        : [];

  const result = await pool.query(
    `
    UPDATE pins
    SET
      title = $3,
      category = $4,
      address = $5,
      status = $6,
      access_level = $7,
      description = $8,
      image_url = $9,
      thumbnail_url = $10,
      image_urls = $11,
      updated_at = NOW()
    WHERE id = $1 AND user_id = $2
    RETURNING
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
      updated_at;
    `,
    [
      id,
      userId,
      title,
      category ?? 'general',
      address ?? null,
      status ?? 'active',
      access_level ?? 'public',
      description ?? null,
      resolvedThumbnail,
      resolvedThumbnail,
      resolvedImages,
    ]
  );

  return result.rows[0] ?? null;
}
