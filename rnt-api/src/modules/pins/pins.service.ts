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
  COALESCE(
    AVG(pins.latitude),
    AVG((requested_tiles.south + requested_tiles.north) / 2)
  )::double precision AS latitude,
  COALESCE(
    AVG(pins.longitude),
    AVG((requested_tiles.west + requested_tiles.east) / 2)
  )::double precision AS longitude,
  COUNT(pins.id)::integer AS pin_count,
  MAX(pins.score) AS top_score
FROM requested_tiles
LEFT JOIN pins
  ON pins.longitude >= requested_tiles.west
 AND pins.longitude < requested_tiles.east
 AND pins.latitude >= requested_tiles.south
 AND pins.latitude < requested_tiles.north
GROUP BY requested_tiles.x, requested_tiles.y, requested_tiles.z `,
  );

  return result.rows;
}

export async function searchPins({
  query,
  limit = 6,
  center,
}: SearchPinsInput) {
  const pool = getPool();

  const term = query?.trim() ?? "";

  if (term.length < 2) {
    return [];
  }

  const threshold = term.includes(" ") ? 0.25 : 0.3;
  await pool.query(`SELECT set_limit(${threshold});`);

  const hasCenter = center && center.lat && center.lng;

  const params: (string | number)[] = [
    term,        // $1
    `%${term}%`, // $2
    limit,       // $3
  ];

  if (hasCenter) {
    params.push(center.lng, center.lat); // $4, $5
  }

  const distanceScore = hasCenter
    ? `LEAST(1.0, EXP(-ST_Distance(
          ST_MakePoint(longitude, latitude)::geography,
          ST_MakePoint($4, $5)::geography
        ) / 8000.0))`
    : `0`;

  const result = await pool.query(
    `
    SELECT
      ${PIN_SELECT_FRAGMENT},

      ${
        hasCenter
          ? `ST_Distance(
              ST_MakePoint(longitude, latitude)::geography,
              ST_MakePoint($4, $5)::geography
            ) AS distance,`
          : `NULL AS distance,`
      }

      (
        -- Position-independent word match against title
        -- "India Gate..." and "Gateway of India..." both score 1.0 for "india"
        -- "cafe prem" and "hauz khas cafe cluster" both score 1.0 for "cafe"
        COALESCE((
          SELECT MAX(similarity(LOWER($1), word))
          FROM unnest(string_to_array(LOWER(title), ' ')) AS word
          WHERE LENGTH(word) >= LENGTH($1) - 1
        ), 0) * 3.0

        -- Address similarity (whole string fine here, addresses are structured)
        + similarity(address, $1) * 1.2

        -- Multi-word query: best per-word match across title words
        -- Helps "hauz khas" match "Hauz Khas Cafe Cluster"
        + COALESCE((
            SELECT MAX(
              (
                SELECT MAX(similarity(LOWER(qword), tword))
                FROM unnest(string_to_array(LOWER(title), ' ')) AS tword
              )
            )
            FROM unnest(string_to_array(LOWER($1), ' ')) AS qword
            WHERE LENGTH(qword) >= 3
          ), 0) * 1.0

        -- Phonetic tiebreaker (very small, just catches "pune" -> "poon" type typos)
        + (GREATEST(
            difference(title, $1),
            difference(address, $1)
          ) / 4.0) * 0.2

        -- Distance: decisive for equal text scores, near-zero across cities
        -- 8km half-life: within city scores high, other cities score ~0
        + ${distanceScore} * 3.0

        -- Popularity: tiny tiebreaker only
        + LOG(GREATEST(score, 0) + 1) * 0.05
      ) AS relevance

    FROM pins
    WHERE status != 'deleted'
      AND (
        -- Exact substring (always include, high recall)
        title ILIKE $2
        OR address ILIKE $2
        OR posted_by ILIKE $2
        OR category ILIKE $2

        -- Word-level containment: query word found inside title
        OR $1 <% title

        -- Whole-string trigram fuzzy (controlled by set_limit)
        OR title % $1
        OR address % $1

        -- Per-word fuzzy: each word of query matched against title/address
        -- Enables "haz khas" -> "hauz khas" without matching unrelated pins
        OR EXISTS (
          SELECT 1
          FROM unnest(string_to_array($1, ' ')) AS q(word)
          WHERE LENGTH(word) >= 3
            AND (word % title OR word % address)
        )

        -- Phonetic: only strong matches (> 3 filters out loose soundex hits)
        OR difference(title, $1) > 3
        OR difference(address, $1) > 3
      )

    ORDER BY relevance DESC, score DESC NULLS LAST, created_at DESC
    LIMIT $3;
    `,
    params
  );

  return result.rows;
}