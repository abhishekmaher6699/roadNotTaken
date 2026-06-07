import { getPool } from "../../config/db";
import type {
  Profile,
  ProfileSearchResult,
  PublicProfileResponse,
  UpdateProfileInput,
} from "./profiles.types";
import { profileQueries } from "./profiles.queries";

import hasOwn, {
  ProfilesServiceError,
  normalizeProfileInput,
} from "./profiles.utils";



export async function getOrCreateProfile(
  userId: string,
  email?: string | null,
): Promise<Profile> {
  const pool = getPool();

  await pool.query(profileQueries.ensureProfile, [userId]);

  const result = await pool.query(
    profileQueries.getProfileByUserId,
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
      profileQueries.updateProfile,
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

  await pool.query(profileQueries.ensurePublicProfile, [userId]);

  const result = await pool.query(
    profileQueries.getPublicProfile,
    [userId],
  );

  const row = result.rows[0];
  if (!row) return null;

  const [pinsResult, commentsResult] = await Promise.all([
    pool.query(
      profileQueries.getPublicProfilePins,
      [userId],
    ),
    pool.query(
      profileQueries.getPublicProfileComments,
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
    profileQueries.searchProfiles,
    [term, `%${term}%`, limit],
  );

  return result.rows;
}
