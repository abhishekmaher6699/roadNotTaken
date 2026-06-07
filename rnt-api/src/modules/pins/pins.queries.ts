function buildPinSelectFragment(
  viewerUserId?: string | null,
  tableName = "pins",
  viewerUserIdParam = "$1",
  profileTableName: string | null = "profiles",
) {
  const likedExpression =
    profileTableName === null
      ? `${tableName}.viewer_has_liked`
      : viewerUserId
        ? `EXISTS (
        SELECT 1
        FROM pin_likes
        WHERE pin_likes.pin_id = ${tableName}.id
          AND pin_likes.user_id = ${viewerUserIdParam}
      )`
        : "false";
  const visitedExpression =
    profileTableName === null
      ? `${tableName}.viewer_has_visited`
      : viewerUserId
        ? `EXISTS (
        SELECT 1
        FROM pin_visits
        WHERE pin_visits.pin_id = ${tableName}.id
          AND pin_visits.user_id = ${viewerUserIdParam}
      )`
        : "false";
  const authorExpression =
    profileTableName === null
      ? `${tableName}.author`
      : `json_build_object(
      'id', ${tableName}.user_id,
      'display_name', ${profileTableName}.display_name,
      'username', ${profileTableName}.username,
      'avatar_url', ${profileTableName}.avatar_url
    )`;

  return `
    ${tableName}.id,
    ${tableName}.user_id,
    ${tableName}.posted_by,
    ${authorExpression} AS author,
    ${tableName}.latitude,
    ${tableName}.longitude,
    ${tableName}.title,
    ${tableName}.category,
    ${tableName}.address,
    ${tableName}.status,
    ${tableName}.access_level,
    ${tableName}.description,
    ${tableName}.thumbnail_url,
    ${tableName}.image_urls,
    COALESCE(${tableName}.likes_count, 0) AS likes_count,
    COALESCE(${tableName}.visits_count, 0) AS visits_count,
    COALESCE(${tableName}.comment_count, 0)::integer AS comment_count,
    ${likedExpression} AS viewer_has_liked,
    ${visitedExpression} AS viewer_has_visited,
    ${tableName}.score,
    ${tableName}.created_at,
    ${tableName}.updated_at
  `;
}

export const pinQueries = {
  createPin(userId: string) {
    return `
      WITH inserted_pin AS (
        INSERT INTO pins (
          title, category, address, status, posted_by, access_level, description, thumbnail_url, image_urls, latitude, longitude, user_id, geom
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
          ST_SetSRID(ST_MakePoint($11, $10), 4326)
        )
        RETURNING *
      )
      SELECT
        ${buildPinSelectFragment(userId, "inserted_pin", "$12")}
      FROM inserted_pin
      LEFT JOIN profiles ON profiles.user_id = inserted_pin.user_id;
    `;
  },

  getAllPins(viewerUserId?: string | null) {
    return `
      SELECT
        ${buildPinSelectFragment(viewerUserId)}
      FROM pins
      LEFT JOIN profiles ON profiles.user_id = pins.user_id
      ORDER BY score DESC NULLS LAST, created_at DESC, id DESC
    `;
  },

  getPinById(viewerUserId: string | null | undefined, idParam: string) {
    return `
      SELECT
        ${buildPinSelectFragment(viewerUserId)}
      FROM pins
      LEFT JOIN profiles ON profiles.user_id = pins.user_id
      WHERE id = ${idParam}::integer
      LIMIT 1;
    `;
  },

  deletePin: `
    DELETE FROM pins
    WHERE id = $1 AND user_id = $2
    RETURNING id;
  `,

  updatePin(userId: string) {
    return `
      WITH updated_pin AS (
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
        RETURNING *
      )
      SELECT
        ${buildPinSelectFragment(userId, "updated_pin", "$2")}
      FROM updated_pin
      LEFT JOIN profiles ON profiles.user_id = updated_pin.user_id;
    `;
  },

  getPinsForTiles({
    tileValuesSql,
    viewportPinLimit,
    viewerUserId,
  }: {
    tileValuesSql: string;
    viewportPinLimit: number;
    viewerUserId?: string | null;
  }) {
    return `
      WITH requested_tiles (x, y, z, west, east, south, north, pin_limit) AS (
        VALUES ${tileValuesSql}
      ),
      ranked_tile_pins AS (
        SELECT
          requested_tiles.x AS tile_x,
          requested_tiles.y AS tile_y,
          requested_tiles.z AS tile_z,
          requested_tiles.pin_limit,
          ${buildPinSelectFragment(viewerUserId, "pins")},
          ROW_NUMBER() OVER (
            PARTITION BY requested_tiles.x, requested_tiles.y, requested_tiles.z
            ORDER BY pins.score DESC NULLS LAST, pins.created_at DESC, pins.id DESC
          ) AS tile_rank
        FROM requested_tiles
        JOIN pins
          ON pins.geom && ST_MakeEnvelope(
            requested_tiles.west,
            requested_tiles.south,
            requested_tiles.east,
            requested_tiles.north,
            4326
          )::geography
        LEFT JOIN profiles ON profiles.user_id = pins.user_id
      )
      SELECT
        ${buildPinSelectFragment(viewerUserId, "ranked_tile_pins", "$1", null)}
      FROM ranked_tile_pins
      WHERE tile_rank <= pin_limit
      ORDER BY score DESC NULLS LAST, created_at DESC, id DESC
      LIMIT ${viewportPinLimit}
    `;
  },

  getPinSummariesForTiles(tileValuesSql: string) {
    return `
      WITH requested_tiles (x, y, z, west, east, south, north) AS (
        VALUES ${tileValuesSql}
      )
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
        ON pins.geom && ST_MakeEnvelope(
          requested_tiles.west,
          requested_tiles.south,
          requested_tiles.east,
          requested_tiles.north,
          4326
        )::geography
      GROUP BY requested_tiles.x, requested_tiles.y, requested_tiles.z
    `;
  },

  searchPins({
    viewerUserId,
    viewerUserIdParam,
    hasCenter,
    distanceScore,
  }: {
    viewerUserId?: string | null;
    viewerUserIdParam: string;
    hasCenter: boolean;
    distanceScore: string;
  }) {
    return `
      SELECT
        ${buildPinSelectFragment(viewerUserId, "pins", viewerUserIdParam)},

        ${
          hasCenter
            ? `ST_Distance(
                pins.geom,
                ST_MakePoint($4, $5)::geography
              ) AS distance,`
            : `NULL AS distance,`
        }

        (
          CASE
            WHEN LOWER(title) = LOWER($1) THEN 12.0
            WHEN LOWER(title) LIKE LOWER($2) THEN 8.0
            WHEN LOWER(COALESCE(address, '')) LIKE LOWER($2) THEN 4.0
            ELSE 0
          END

          + COALESCE((
            SELECT AVG(
              CASE
                WHEN EXISTS (
                  SELECT 1
                  FROM unnest(
                    string_to_array(
                      LOWER(CONCAT_WS(' ', title, address, category)),
                      ' '
                    )
                  ) AS document_words(document_word)
                  WHERE document_word = LOWER(qword)
                    OR document_word LIKE LOWER(qword) || '%'
                    OR similarity(document_word, LOWER(qword)) >= 0.72
                ) THEN 1.0
                ELSE 0.0
              END
            )
            FROM unnest(string_to_array(LOWER($1), ' ')) AS qword
            WHERE LENGTH(qword) >= 3
          ), 0) * 5.0

          + COALESCE((
            SELECT MAX(similarity(LOWER($1), word))
            FROM unnest(string_to_array(LOWER(title), ' ')) AS word
            WHERE LENGTH(word) >= LENGTH($1) - 1
          ), 0) * 3.0

          + COALESCE(similarity(address, $1), 0) * 1.2

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

          + (GREATEST(
              difference(title, $1),
              COALESCE(difference(address, $1), 0)
            ) / 4.0) * 0.2

          + ${distanceScore} * 3.0
          + LOG(GREATEST(score, 0) + 1) * 0.05
          + GREATEST(
              COALESCE(similarity(profiles.display_name, $1), 0),
              COALESCE(similarity(profiles.username, $1), 0)
            ) * 1.1
        ) AS relevance

      FROM pins
      LEFT JOIN profiles
        ON profiles.user_id = pins.user_id
      WHERE status != 'deleted'
        AND (
          title ILIKE $2
          OR address ILIKE $2
          OR profiles.display_name ILIKE $2
          OR profiles.username ILIKE $2
          OR category ILIKE $2
          OR $1 <% title
          OR $1 <% profiles.display_name
          OR $1 <% profiles.username
          OR $1 <% address
          OR title % $1
          OR address % $1
          OR profiles.display_name % $1
          OR profiles.username % $1
          OR EXISTS (
            SELECT 1
            FROM unnest(string_to_array($1, ' ')) AS q(word)
            WHERE LENGTH(word) >= 3
              AND (
                word % title
                OR word % address
                OR word % profiles.display_name
                OR word % profiles.username
              )
          )
          OR difference(title, $1) > 3
          OR difference(address, $1) > 3
        )

      ORDER BY relevance DESC, score DESC NULLS LAST, created_at DESC
      LIMIT $3;
    `;
  },

  begin: "BEGIN",
  commit: "COMMIT",
  rollback: "ROLLBACK",

  insertPinLike: `
    INSERT INTO pin_likes (pin_id, user_id)
    VALUES ($1::integer, $2)
    ON CONFLICT (pin_id, user_id) DO NOTHING
    RETURNING id;
  `,

  incrementPinLikes: `
    UPDATE pins
    SET likes_count = COALESCE(likes_count, 0) + 1
    WHERE id = $1::integer
    RETURNING COALESCE(likes_count, 0) AS likes_count;
  `,

  deletePinLike: `
    DELETE FROM pin_likes
    WHERE pin_id = $1::integer AND user_id = $2
    RETURNING id;
  `,

  decrementPinLikes: `
    UPDATE pins
    SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0)
    WHERE id = $1::integer
  `,

  getPinLikesCount: `
    SELECT COALESCE(likes_count, 0) AS likes_count
    FROM pins
    WHERE id = $1::integer
  `,

  visitPin: `
    WITH target AS (
      SELECT id
      FROM pins
      WHERE id = $1::integer
    ),
    inserted AS (
      INSERT INTO pin_visits (pin_id, user_id)
      SELECT id, $2
      FROM target
      ON CONFLICT (pin_id, user_id) DO NOTHING
      RETURNING pin_id
    ),
    updated AS (
      UPDATE pins
      SET visits_count = COALESCE(visits_count, 0) + 1
      WHERE id IN (SELECT pin_id FROM inserted)
      RETURNING COALESCE(visits_count, 0) AS visits_count
    )
    SELECT
      EXISTS (SELECT 1 FROM target) AS found,
      true AS visited,
      COALESCE(
        (SELECT visits_count FROM updated),
        (SELECT COALESCE(visits_count, 0) FROM pins WHERE id = $1::integer)
      ) AS visits_count;
  `,

  unvisitPin: `
    WITH target AS (
      SELECT id
      FROM pins
      WHERE id = $1::integer
    ),
    deleted AS (
      DELETE FROM pin_visits
      WHERE pin_id = $1::integer AND user_id = $2
      RETURNING pin_id
    ),
    updated AS (
      UPDATE pins
      SET visits_count = GREATEST(COALESCE(visits_count, 0) - 1, 0)
      WHERE id IN (SELECT pin_id FROM deleted)
      RETURNING COALESCE(visits_count, 0) AS visits_count
    )
    SELECT
      EXISTS (SELECT 1 FROM target) AS found,
      false AS visited,
      COALESCE(
        (SELECT visits_count FROM updated),
        (SELECT COALESCE(visits_count, 0) FROM pins WHERE id = $1::integer)
      ) AS visits_count;
  `,
};
