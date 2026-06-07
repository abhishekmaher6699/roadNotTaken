import { getPool, queryDb, runDbQueryWithName } from "../../config/db";
import {
  CreatePinInput,
  LikeMutationResult,
  SearchPinsInput,
  TileQueryInput,
  UpdatePinInput,
  VisitMutationResult,
  PinPage,
  PinPageInput,
} from "./pins.types";
import { getViewportPinLimit } from "./pins.helpers";
import { pinQueries } from "./pins.queries";
import {
  buildRankedRequestedTiles,
  buildRankedTileValuesSql,
  buildSummaryRequestedTiles,
  buildSummaryTileValuesSql,
} from "./pins.tile-queries";
import { buildPinPage, preparePinPage } from "./pins.pagination";

export async function createPin(data: CreatePinInput) {
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

  const result = await queryDb(
    "pins.create",
    pinQueries.createPin(user_id),
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

export async function getAllPins(
  viewerUserId?: string | null,
  pageInput: PinPageInput = {},
): Promise<PinPage> {
  const { cursor, limit } = preparePinPage(pageInput);
  const params: (number | string)[] = [];

  if (viewerUserId) {
    params.push(viewerUserId);
  }

  const viewerUserIdParam = viewerUserId ? "$1" : "$1";
  let cursorClause = "";

  if (cursor) {
    params.push(cursor.score, cursor.created_at, cursor.id);
    const scoreParam = `$${params.length - 2}`;
    const createdAtParam = `$${params.length - 1}`;
    const idParam = `$${params.length}`;

    cursorClause = `
      WHERE (
        COALESCE(pins.score, -2147483648),
        pins.created_at,
        pins.id
      ) < (
        ${scoreParam}::integer,
        ${createdAtParam}::timestamp,
        ${idParam}::integer
      )
    `;
  }

  params.push(limit + 1);
  const limitParam = `$${params.length}`;

  const result = await queryDb(
    "pins.list",
    pinQueries.getAllPins({
      viewerUserId,
      cursorClause,
      limitParam,
      viewerUserIdParam,
    }),
    params,
  );

  return buildPinPage(result.rows, limit);
}

export async function getPinById(id: string, viewerUserId?: string | null) {
  const params = viewerUserId ? [viewerUserId, id] : [id];
  const idParam = viewerUserId ? "$2" : "$1";

  const result = await queryDb(
    "pins.by_id",
    pinQueries.getPinById(viewerUserId, idParam),
    params,
  );

  return result.rows[0] ?? null;
}

export async function deletePinById(id: string, userId: string) {
  const result = await queryDb(
    "pins.delete",
    pinQueries.deletePin,
    [id, userId],
  );

  return result.rows[0] ?? null;
}

export async function updatePinById(
  id: string,
  userId: string,
  data: UpdatePinInput,
) {
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

  const result = await queryDb(
    "pins.update",
    pinQueries.updatePin(userId),
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

export async function getPinsForTiles(
  { tiles }: TileQueryInput,
  viewerUserId?: string | null,
) {
  if (tiles.length === 0) {
    return [];
  }

  // How:
  // - Use the highest zoom from the request batch to choose the final viewport cap.
  // - Prepare every requested tile with geographic bounds and a per-tile pin limit.
  // - Turn those prepared tiles into one SQL VALUES table.
  const viewportPinLimit = getViewportPinLimit(
    Math.max(...tiles.map((tile) => tile.z)),
  );
  const requestedTiles = buildRankedRequestedTiles(tiles);
  const tileValuesSql = buildRankedTileValuesSql(requestedTiles);
  const params = viewerUserId ? [viewerUserId] : [];

  const result = await queryDb(
    "pins.tiles.query",
    pinQueries.getPinsForTiles({ tileValuesSql, viewportPinLimit, viewerUserId }),
    params,
  );

  return result.rows;
}

export async function getPinSummariesForTiles({ tiles }: TileQueryInput) {
  if (tiles.length === 0) {
    return [];
  }

  // How:
  // - Prepare each incoming tile with its geographic bounds.
  // - Turn those tiles into one inline SQL table.
  // - Aggregate pins per tile instead of returning them individually.
  const requestedTiles = buildSummaryRequestedTiles(tiles);
  const tileValuesSql = buildSummaryTileValuesSql(requestedTiles);

  const result = await queryDb(
    "pins.tiles.summary",
    pinQueries.getPinSummariesForTiles(tileValuesSql),
  );

  return result.rows;
}

export async function searchPins({
  query,
  limit = 6,
  center,
}: SearchPinsInput, viewerUserId?: string | null) {
  const pool = getPool();

  const term = query?.trim() ?? "";

  if (term.length < 2) {
    return [];
  }

  const threshold = term.includes(" ") ? 0.25 : 0.3;

  const hasCenter = center && center.lat && center.lng;

  const params: (string | number)[] = [
    term,        // $1
    `%${term}%`, // $2
    limit,       // $3
  ];

  if (hasCenter) {
    params.push(center.lng, center.lat); // $4, $5
  }

  const viewerUserIdParam = viewerUserId
    ? `$${params.length + 1}`
    : "$1";

  if (viewerUserId) {
    params.push(viewerUserId);
  }

  const distanceScore = hasCenter
    ? `LEAST(1.0, EXP(-ST_Distance(
          pins.geom,
          ST_MakePoint($4, $5)::geography
        ) / 80000.0))`
    : `0`;

  // set_limit is a session-level setting — must run on the same connection as the search
  // query to prevent it from leaking to other callers through the pool.
  const client = await pool.connect();
  try {
    const result = await runDbQueryWithName("pins.search", async () => {
      await client.query(`SELECT set_limit($1)`, [threshold]);
      return client.query(
        pinQueries.searchPins({
          viewerUserId,
          viewerUserIdParam,
          hasCenter: Boolean(hasCenter),
          distanceScore,
        }),
        params,
      );
    });
    return result.rows;
  } finally {
    client.release();
  }
}

export async function likePinById(
  pinId: string,
  userId: string,
): Promise<LikeMutationResult | null> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    return await runDbQueryWithName("pins.like", async () => {
      await client.query(pinQueries.begin);

      const insertResult = await client.query(
        pinQueries.insertPinLike,
        [pinId, userId],
      );

      if (insertResult.rowCount === 0) {
        const existing = await client.query(
          pinQueries.getPinLikesCount,
          [pinId],
        );
        await client.query(pinQueries.commit);
        return existing.rows[0]
          ? { liked: true, likes_count: existing.rows[0].likes_count }
          : null;
      }

      const updateResult = await client.query(
        pinQueries.incrementPinLikes,
        [pinId],
      );

      await client.query(pinQueries.commit);
      return updateResult.rows[0]
        ? { liked: true, likes_count: updateResult.rows[0].likes_count }
        : null;
    });
  } catch (error) {
    await client.query(pinQueries.rollback);
    throw error;
  } finally {
    client.release();
  }
}

export async function unlikePinById(
  pinId: string,
  userId: string,
): Promise<LikeMutationResult | null> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    return await runDbQueryWithName("pins.unlike", async () => {
      await client.query(pinQueries.begin);

      const deleteResult = await client.query(
        pinQueries.deletePinLike,
        [pinId, userId],
      );

      if ((deleteResult.rowCount ?? 0) > 0) {
        await client.query(
          pinQueries.decrementPinLikes,
          [pinId],
        );
      }

      const pinResult = await client.query(
        pinQueries.getPinLikesCount,
        [pinId],
      );

      await client.query(pinQueries.commit);
      return pinResult.rows[0]
        ? { liked: false, likes_count: pinResult.rows[0].likes_count }
        : null;
    });
  } catch (error) {
    await client.query(pinQueries.rollback);
    throw error;
  } finally {
    client.release();
  }
}

export async function visitPinById(
  pinId: string,
  userId: string,
): Promise<VisitMutationResult | null> {
  const result = await queryDb(
    "pins.visit",
    pinQueries.visitPin,
    [pinId, userId],
  );

  const row = result.rows[0];
  return row?.found
    ? { visited: row.visited, visits_count: row.visits_count }
    : null;
}

export async function unvisitPinById(
  pinId: string,
  userId: string,
): Promise<VisitMutationResult | null> {
  const result = await queryDb(
    "pins.unvisit",
    pinQueries.unvisitPin,
    [pinId, userId],
  );

  const row = result.rows[0];
  return row?.found
    ? { visited: row.visited, visits_count: row.visits_count }
    : null;
}
