import { getPool } from "../../config/db";
import {
  CreatePinInput,
  SearchPinsInput,
  TileQueryInput,
  UpdatePinInput,
} from "./pins.types";
import { getViewportPinLimit } from "./pins.helpers";
import {
  buildRankedRequestedTiles,
  buildRankedTileValuesSql,
  buildSummaryRequestedTiles,
  buildSummaryTileValuesSql,
} from "./pins.tile-queries";

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
  thumbnail_url,
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
    thumbnail_url,
    image_urls,
    latitude,
    longitude,
    user_id,
  } = data;

  const resolvedThumbnail = thumbnail_url ?? null;
  const resolvedImages =
    image_urls && image_urls.length > 0
      ? image_urls
      : resolvedThumbnail
        ? [resolvedThumbnail]
        : [];

  const result = await pool.query(
    `
    INSERT INTO pins (
      title, category, address, status, posted_by, access_level, description, thumbnail_url, image_urls, latitude, longitude, user_id, geom
    )
    VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
      ST_SetSRID(ST_MakePoint($11, $10), 4326)
    )
    RETURNING *;
    `,
    [
      title,
      category ?? "general",
      address ?? null,
      status ?? "active",
      posted_by ?? null,
      access_level ?? "public",
      description,
      resolvedThumbnail,
      resolvedImages,
      latitude,
      longitude,
      user_id,
    ],
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
    `,
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
    [id, userId],
  );

  return result.rows[0] ?? null;
}

export async function updatePinById(
  id: string,
  userId: string,
  data: UpdatePinInput,
) {
  const pool = getPool();

  const {
    title,
    category,
    address,
    status,
    access_level,
    description,
    thumbnail_url,
    image_urls,
  } = data;

  const resolvedThumbnail = thumbnail_url ?? null;
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
      thumbnail_url = $9,
      image_urls = $10,
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
      thumbnail_url,
      image_urls,
      score,
      created_at,
      updated_at;
    `,
    [
      id,
      userId,
      title,
      category ?? "general",
      address ?? null,
      status ?? "active",
      access_level ?? "public",
      description ?? null,
      resolvedThumbnail,
      resolvedImages,
    ],
  );

  return result.rows[0] ?? null;
}

export async function getPinsForTiles({ tiles }: TileQueryInput) {
  if (tiles.length === 0) {
    return [];
  }

  const pool = getPool();
  // How:
  // - Use the highest zoom from the request batch to choose the final viewport cap.
  // - Prepare every requested tile with geographic bounds and a per-tile pin limit.
  // - Turn those prepared tiles into one SQL VALUES table.
  const viewportPinLimit = getViewportPinLimit(
    Math.max(...tiles.map((tile) => tile.z)),
  );
  const requestedTiles = buildRankedRequestedTiles(tiles);
  const tileValuesSql = buildRankedTileValuesSql(requestedTiles);

  const result = await pool.query(
    `
    -- Each request tile becomes a geographic box with its own zoom-aware pin cap.
    -- How:
    -- 1. requested_tiles is an inline table of the incoming tile boxes.
    -- 2. ranked_tile_pins joins every matching pin against those boxes.
    -- 3. ROW_NUMBER ranks pins independently inside each tile.
    -- 4. The outer query keeps only the top pins per tile and then applies one final viewport cap.
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
    -- Hybrid limiting: first cap per tile, then cap the combined viewport result.
    WHERE tile_rank <= pin_limit
    ORDER BY score DESC NULLS LAST, created_at DESC, id DESC
    LIMIT ${viewportPinLimit}
    `,
  );

  return result.rows;
}

export async function getPinSummariesForTiles({ tiles }: TileQueryInput) {
  if (tiles.length === 0) {
    return [];
  }

  const pool = getPool();
  // How:
  // - Prepare each incoming tile with its geographic bounds.
  // - Turn those tiles into one inline SQL table.
  // - Aggregate pins per tile instead of returning them individually.
  const requestedTiles = buildSummaryRequestedTiles(tiles);
  const tileValuesSql = buildSummaryTileValuesSql(requestedTiles);

  const result = await pool.query(
    `
    WITH requested_tiles (x, y, z, west, east, south, north) AS (
      VALUES ${tileValuesSql}
    )
    -- Low zooms use summaries so the map still signals where activity exists.
    -- How:
    -- 1. Join pins to requested tile boxes by latitude/longitude range.
    -- 2. Group by tile key.
    -- 3. Compute one centroid marker with AVG(lat/lng), plus count and top_score.
    SELECT
      requested_tiles.x,
      requested_tiles.y,
      requested_tiles.z,
      AVG(pins.latitude)::double precision AS latitude,
      AVG(pins.longitude)::double precision AS longitude,
      COUNT(pins.id)::integer AS pin_count,
      MAX(pins.score) AS top_score
    FROM requested_tiles
    JOIN pins
      ON pins.longitude >= requested_tiles.west
     AND pins.longitude < requested_tiles.east
     AND pins.latitude >= requested_tiles.south
     AND pins.latitude < requested_tiles.north
    GROUP BY requested_tiles.x, requested_tiles.y, requested_tiles.z
    ORDER BY pin_count DESC, top_score DESC NULLS LAST, requested_tiles.z DESC
    `,
  );

  return result.rows;
}

export async function searchPins({ query, limit = 6, bounds }: SearchPinsInput) {
  const pool = getPool();

  const term = query?.trim() ?? '';

  if (term.length < 2) {
    return [];
  }

  // How:
  // - Only search columns with pg_trgm GIN indexes (title, address, posted_by) or B-Tree (category).
  // - If viewport bounds are provided, pins INSIDE the current view get a proximity bonus in ORDER BY.
  //   This makes the search context-aware: searching "ruins" while looking at Rome surfaces Rome pins first.
  // - Fallback ordering is score DESC so the best-quality pins still win globally.
  const params: (string | number)[] = [`%${term}%`, limit];

  let proximityClause = '0'; // default: no boost
  if (bounds) {
    params.push(bounds.south, bounds.north, bounds.west, bounds.east);
    const s = params.length - 3;
    proximityClause = `
      CASE
        WHEN latitude  BETWEEN $${s}::float AND $${s + 1}::float
         AND longitude BETWEEN $${s + 2}::float AND $${s + 3}::float
        THEN 1 ELSE 0
      END`;
  }

  const result = await pool.query(
    `
    SELECT
      ${PIN_SELECT_FRAGMENT}
    FROM pins
    WHERE status != 'deleted'
      AND (
        title      ILIKE $1
        OR address ILIKE $1
        OR posted_by ILIKE $1
        OR category  ILIKE $1
      )
    ORDER BY
      ${proximityClause} DESC,
      score DESC NULLS LAST,
      created_at DESC
    LIMIT $2;
    `,
    params
  );

  return result.rows;
}
