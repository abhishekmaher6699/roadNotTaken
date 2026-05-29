import { getPool } from "../../config/db";
import type {
  Profile,
  ProfileSearchResult,
  PublicProfileResponse,
  UpdateProfileInput,
} from "./profiles.types";

import hasOwn, {
  ProfilesServiceError,
  normalizeProfileInput,
} from "./profiles.utils";



export async function getOrCreateProfile(
  userId: string,
  email?: string | null,
): Promise<Profile> {
  const pool = getPool();

  await pool.query(
    `
    INSERT INTO profiles (user_id)
    VALUES ($1)
    ON CONFLICT (user_id) DO NOTHING;
    `,
    [userId],
  );

  const result = await pool.query(
    `
    SELECT
      user_id,
      username,
      display_name,
      bio,
      avatar_url,
      location,
      website,
      created_at,
      updated_at
    FROM profiles
    WHERE user_id = $1;
    `,
    [userId],
  );

  return {
    ...result.rows[0],
    email: email ?? undefined,
  };
}

export async function updateProfile(
  userId: string,
  input: UpdateProfileInput,
  email?: string | null,
): Promise<Profile> {
  const pool = getPool();
  const current = await getOrCreateProfile(userId, email);
  const normalized = normalizeProfileInput(input);

  const next = {
    username: hasOwn(input, "username") ? normalized.username : current.username,
    display_name: hasOwn(input, "display_name")
      ? normalized.display_name
      : current.display_name,
    bio: hasOwn(input, "bio") ? normalized.bio : current.bio,
    avatar_url: hasOwn(input, "avatar_url")
      ? normalized.avatar_url
      : current.avatar_url,
    location: hasOwn(input, "location") ? normalized.location : current.location,
    website: hasOwn(input, "website") ? normalized.website : current.website,
  };

  try {
    const result = await pool.query(
      `
      UPDATE profiles
      SET
        username = $2,
        display_name = $3,
        bio = $4,
        avatar_url = $5,
        location = $6,
        website = $7,
        updated_at = now()
      WHERE user_id = $1
      RETURNING
        user_id,
        username,
        display_name,
        bio,
        avatar_url,
        location,
        website,
        created_at,
        updated_at;
      `,
      [
        userId,
        next.username,
        next.display_name,
        next.bio,
        next.avatar_url,
        next.location,
        next.website,
      ],
    );

    return {
      ...result.rows[0],
      email: email ?? undefined,
    };
  } catch (error: any) {
    if (error?.code === "23505") {
      throw new ProfilesServiceError("username is already taken", 409);
    }

    throw error;
  }
}

export async function getPublicProfile(
  userId: string,
): Promise<PublicProfileResponse | null> {
  const pool = getPool();

  await pool.query(
    `
    INSERT INTO profiles (user_id)
    SELECT $1
    WHERE EXISTS (SELECT 1 FROM pins WHERE user_id = $1)
       OR EXISTS (SELECT 1 FROM comments WHERE user_id = $1)
    ON CONFLICT (user_id) DO NOTHING;
    `,
    [userId],
  );

  const result = await pool.query(
    `
    SELECT
      profiles.user_id,
      profiles.username,
      profiles.display_name,
      profiles.bio,
      profiles.avatar_url,
      profiles.location,
      profiles.website,
      profiles.created_at,
      COALESCE(pin_stats.pin_count, 0)::integer AS pin_count,
      COALESCE(pin_stats.pin_karma, 0)::integer AS pin_karma,
      COALESCE(comment_stats.comment_count, 0)::integer AS comment_count,
      COALESCE(comment_stats.comment_karma, 0)::integer AS comment_karma
    FROM profiles
    LEFT JOIN (
      SELECT
        user_id,
        COUNT(*) AS pin_count,
        SUM(COALESCE(likes_count, 0)) AS pin_karma
      FROM pins
      WHERE user_id = $1
      GROUP BY user_id
    ) pin_stats ON pin_stats.user_id = profiles.user_id
    LEFT JOIN (
      SELECT
        user_id,
        COUNT(*) AS comment_count,
        SUM(COALESCE(likes_count, 0)) AS comment_karma
      FROM comments
      WHERE user_id = $1
      GROUP BY user_id
    ) comment_stats ON comment_stats.user_id = profiles.user_id
    WHERE profiles.user_id = $1;
    `,
    [userId],
  );

  const row = result.rows[0];
  if (!row) return null;

  const [pinsResult, commentsResult] = await Promise.all([
    pool.query(
      `
      SELECT
        pins.id::text,
        pins.title,
        pins.address,
        COALESCE(pins.likes_count, 0)::integer AS likes_count,
        (
          SELECT COUNT(*)
          FROM comments
          WHERE comments.pin_id = pins.id
        )::integer AS comment_count,
        pins.created_at
      FROM pins
      WHERE pins.user_id = $1
      ORDER BY pins.created_at DESC, pins.id DESC
      LIMIT 10;
      `,
      [userId],
    ),
    pool.query(
      `
      SELECT
        comments.id,
        comments.pin_id,
        pins.title AS pin_title,
        comments.content,
        COALESCE(comments.likes_count, 0)::integer AS likes_count,
        comments.created_at
      FROM comments
      LEFT JOIN pins ON pins.id = comments.pin_id
      WHERE comments.user_id = $1
      ORDER BY comments.created_at DESC, comments.id DESC
      LIMIT 10;
      `,
      [userId],
    ),
  ]);

  return {
    user: {
      user_id: row.user_id,
      username: row.username,
      display_name: row.display_name,
      bio: row.bio,
      avatar_url: row.avatar_url,
      location: row.location,
      website: row.website,
      created_at: row.created_at,
    },
    stats: {
      total_karma: row.pin_karma + row.comment_karma,
      pin_karma: row.pin_karma,
      comment_karma: row.comment_karma,
      pin_count: row.pin_count,
      comment_count: row.comment_count,
    },
    content: {
      pins: pinsResult.rows,
      comments: commentsResult.rows,
    },
  };
}

export async function searchProfiles(
  query: string,
  limit = 8,
): Promise<ProfileSearchResult[]> {
  const pool = getPool();
  const term = query.trim();

  if (term.length < 2) {
    return [];
  }

  const result = await pool.query(
    `
    SELECT
      profiles.user_id,
      profiles.username,
      profiles.display_name,
      profiles.bio,
      profiles.avatar_url,
      profiles.location,
      (
        COALESCE(pin_stats.pin_karma, 0)
        + COALESCE(comment_stats.comment_karma, 0)
      )::integer AS total_karma,
      COALESCE(pin_stats.pin_count, 0)::integer AS pin_count,
      COALESCE(comment_stats.comment_count, 0)::integer AS comment_count
    FROM profiles
    LEFT JOIN (
      SELECT
        user_id,
        COUNT(*) AS pin_count,
        SUM(COALESCE(likes_count, 0)) AS pin_karma
      FROM pins
      GROUP BY user_id
    ) pin_stats ON pin_stats.user_id = profiles.user_id
    LEFT JOIN (
      SELECT
        user_id,
        COUNT(*) AS comment_count,
        SUM(COALESCE(likes_count, 0)) AS comment_karma
      FROM comments
      GROUP BY user_id
    ) comment_stats ON comment_stats.user_id = profiles.user_id
    WHERE
      profiles.display_name ILIKE $2
      OR profiles.username ILIKE $2
      OR profiles.display_name % $1
      OR profiles.username % $1
    ORDER BY
      GREATEST(
        COALESCE(similarity(profiles.display_name, $1), 0),
        COALESCE(similarity(profiles.username, $1), 0)
      ) DESC,
      total_karma DESC,
      profiles.created_at DESC
    LIMIT $3;
    `,
    [term, `%${term}%`, limit],
  );

  return result.rows;
}
