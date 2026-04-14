import { getPool } from '../../config/db';
import { CreatePinInput, TileQueryInput, UpdatePinInput } from './pins.types';
import { getPinsPerTileLimit, getViewportPinLimit, tileToBounds } from './pins.helpers';

const PIN_SELECT_FRAGMENT = `
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
  score,
  created_at,
  updated_at
`;

const RANKED_TILE_PIN_SELECT_FRAGMENT = `
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
  thumbnail_url,
  image_urls,
  score,
  created_at,
  updated_at
`;

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

export async function getAllPins() {
  const pool = getPool();

  const result = await pool.query(
    `
    SELECT
      ${PIN_SELECT_FRAGMENT}
    FROM pins
    ORDER BY score DESC NULLS LAST, created_at DESC, id DESC
    `
  );

  return result.rows;
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
      score,
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

export async function getPinsForTiles({ tiles }: TileQueryInput) {
  if (tiles.length === 0) {
    return [];
  }

  const pool = getPool();
  const viewportPinLimit = getViewportPinLimit(
    Math.max(...tiles.map((tile) => tile.z))
  );
  const requestedTiles = tiles.map((tile) => {
    const bounds = tileToBounds(tile);

    return {
      ...tile,
      ...bounds,
      pinLimit: getPinsPerTileLimit(tile.z),
    };
  });

  const tileValuesSql = requestedTiles
    .map(
      (tile) =>
        `(${tile.x}, ${tile.y}, ${tile.z}, ${tile.west}, ${tile.east}, ${tile.south}, ${tile.north}, ${tile.pinLimit})`
    )
    .join(', ');

  const result = await pool.query(
    `
    WITH requested_tiles (x, y, z, west, east, south, north, pin_limit) AS (
      VALUES ${tileValuesSql}
    ),
    ranked_tile_pins AS (
      SELECT
        requested_tiles.x AS tile_x,
        requested_tiles.y AS tile_y,
        requested_tiles.z AS tile_z,
        requested_tiles.pin_limit,
        ${PIN_SELECT_FRAGMENT},
        ROW_NUMBER() OVER (
          PARTITION BY requested_tiles.x, requested_tiles.y, requested_tiles.z
          ORDER BY pins.score DESC NULLS LAST, pins.created_at DESC, pins.id DESC
        ) AS tile_rank
      FROM requested_tiles
      JOIN pins
        ON pins.longitude >= requested_tiles.west
       AND pins.longitude < requested_tiles.east
       AND pins.latitude >= requested_tiles.south
       AND pins.latitude < requested_tiles.north
    )
    SELECT
      ${RANKED_TILE_PIN_SELECT_FRAGMENT}
    FROM ranked_tile_pins
    WHERE tile_rank <= pin_limit
    ORDER BY score DESC NULLS LAST, created_at DESC, id DESC
    LIMIT ${viewportPinLimit}
    `
  );

  return result.rows;
}
