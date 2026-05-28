import { getPool } from "../../config/db";
import type {
  Profile,
  PublicProfileResponse,
  UpdateProfileInput,
} from "./profiles.types";

const RESERVED_USERNAMES = new Set([
  "admin",
  "api",
  "auth",
  "login",
  "logout",
  "me",
  "profile",
  "profiles",
  "signup",
  "support",
]);

export class ProfilesServiceError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ProfilesServiceError";
  }
}

function optionalText(value: unknown, maxLength: number, field: string) {
  if (value == null) return null;
  if (typeof value !== "string") {
    throw new ProfilesServiceError(`${field} must be text`, 400);
  }

  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > maxLength) {
    throw new ProfilesServiceError(`${field} is too long`, 400);
  }

  return trimmed;
}

function normalizeUsername(value: unknown) {
  const username = optionalText(value, 32, "username")?.toLowerCase() ?? null;

  if (!username) return null;
  if (!/^[a-z0-9_-]+$/.test(username)) {
    throw new ProfilesServiceError("username contains invalid characters", 400);
  }
  if (RESERVED_USERNAMES.has(username)) {
    throw new ProfilesServiceError("username is reserved", 400);
  }

  return username;
}

function normalizeWebsite(value: unknown) {
  const website = optionalText(value, 160, "website");
  if (!website) return null;

  try {
    const url = new URL(website);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("Invalid protocol");
    }
    return url.toString();
  } catch {
    throw new ProfilesServiceError("website must be a valid URL", 400);
  }
}

function normalizeAvatarUrl(value: unknown) {
  const avatarUrl = optionalText(value, 500, "avatar_url");
  if (!avatarUrl) return null;

  try {
    const url = new URL(avatarUrl);
    if (url.protocol !== "https:" || url.hostname !== "res.cloudinary.com") {
      throw new Error("Untrusted avatar URL");
    }
    return url.toString();
  } catch {
    throw new ProfilesServiceError("avatar_url must be a trusted upload URL", 400);
  }
}

function normalizeProfileInput(input: UpdateProfileInput) {
  return {
    username: normalizeUsername(input.username),
    display_name: optionalText(input.display_name, 40, "display_name"),
    bio: optionalText(input.bio, 240, "bio"),
    avatar_url: normalizeAvatarUrl(input.avatar_url),
    location: optionalText(input.location, 80, "location"),
    website: normalizeWebsite(input.website),
  };
}

function hasOwn(input: UpdateProfileInput, key: keyof UpdateProfileInput) {
  return Object.prototype.hasOwnProperty.call(input, key);
}

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
  };
}
