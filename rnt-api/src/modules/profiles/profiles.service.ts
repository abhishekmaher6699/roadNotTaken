import { queryDb } from "../../config/db";
import type {
  Profile,
  ProfileFollowMutationResponse,
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
  await queryDb("profiles.ensure", profileQueries.ensureProfile, [userId]);

  const result = await queryDb(
    "profiles.me",
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
    const result = await queryDb(
      "profiles.update",
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

async function ensureFollowableProfile(userId: string) {
  await queryDb(
    "profiles.follow.ensure_target",
    profileQueries.ensureFollowTargetProfile,
    [userId],
  );

  const result = await queryDb(
    "profiles.follow.target",
    profileQueries.getProfileByUserId,
    [userId],
  );

  return result.rows[0] as Profile | undefined;
}

async function getProfileFollowMutationResponse(
  followerUserId: string,
  followingUserId: string,
): Promise<ProfileFollowMutationResponse> {
  const result = await queryDb(
    "profiles.follow.stats",
    profileQueries.getProfileFollowStats,
    [followerUserId, followingUserId],
  );

  const row = result.rows[0];
  return {
    following: Boolean(row?.following),
    followers_count: row?.followers_count ?? 0,
    following_count: row?.following_count ?? 0,
  };
}

export async function getPublicProfile(
  userId: string,
  viewerUserId?: string | null,
): Promise<PublicProfileResponse | null> {
  await queryDb("profiles.public.ensure", profileQueries.ensurePublicProfile, [userId]);

  const result = await queryDb(
    "profiles.public",
    profileQueries.getPublicProfile,
    [userId, viewerUserId ?? null],
  );

  const row = result.rows[0];
  if (!row) return null;

  const [pinsResult, commentsResult] = await Promise.all([
    queryDb(
      "profiles.public.pins",
      profileQueries.getPublicProfilePins,
      [userId],
    ),
    queryDb(
      "profiles.public.comments",
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
      followers_count: row.followers_count,
      following_count: row.following_count,
    },
    viewer_has_followed: Boolean(row.viewer_has_followed),
    content: {
      pins: pinsResult.rows,
      comments: commentsResult.rows,
    },
  };
}

export async function followProfile(
  followerUserId: string,
  followingUserId: string,
): Promise<ProfileFollowMutationResponse> {
  if (followerUserId === followingUserId) {
    throw new ProfilesServiceError("You cannot follow yourself", 400);
  }

  await getOrCreateProfile(followerUserId);
  const target = await ensureFollowableProfile(followingUserId);

  if (!target) {
    throw new ProfilesServiceError("Profile not found", 404);
  }

  await queryDb(
    "profiles.follow",
    profileQueries.followProfile,
    [followerUserId, followingUserId],
  );

  return getProfileFollowMutationResponse(followerUserId, followingUserId);
}

export async function unfollowProfile(
  followerUserId: string,
  followingUserId: string,
): Promise<ProfileFollowMutationResponse> {
  if (followerUserId === followingUserId) {
    throw new ProfilesServiceError("You cannot unfollow yourself", 400);
  }

  await getOrCreateProfile(followerUserId);
  const target = await ensureFollowableProfile(followingUserId);

  if (!target) {
    throw new ProfilesServiceError("Profile not found", 404);
  }

  await queryDb(
    "profiles.unfollow",
    profileQueries.unfollowProfile,
    [followerUserId, followingUserId],
  );

  return getProfileFollowMutationResponse(followerUserId, followingUserId);
}

export async function searchProfiles(
  query: string,
  limit = 8,
): Promise<ProfileSearchResult[]> {
  const term = query.trim();

  if (term.length < 2) {
    return [];
  }

  const result = await queryDb(
    "profiles.search",
    profileQueries.searchProfiles,
    [term, `%${term}%`, limit],
  );

  return result.rows;
}
