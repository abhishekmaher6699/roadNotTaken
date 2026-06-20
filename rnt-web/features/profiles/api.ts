import { apiClient } from "@/lib/api-client";
import { createAsyncCache } from "@/lib/async-cache";
import type {
  Profile,
  ProfileFollowListKind,
  ProfileFollowListPage,
  ProfileFollowMutationResponse,
  ProfileSearchResult,
  PublicProfileResponse,
  UpdateProfileInput,
} from "./types";

const PUBLIC_PROFILE_CACHE_TTL_MS = 15_000;
const PROFILE_FOLLOW_LIST_CACHE_TTL_MS = 15_000;
const publicProfileCache = createAsyncCache<PublicProfileResponse>(
  PUBLIC_PROFILE_CACHE_TTL_MS,
);
const followListCache = createAsyncCache<ProfileFollowListPage>(
  PROFILE_FOLLOW_LIST_CACHE_TTL_MS,
);

export function invalidatePublicProfileCache(userId?: string | null) {
  if (!userId) {
    publicProfileCache.clear();
    return;
  }

  publicProfileCache.delete(userId);
}

export function invalidateProfileFollowListCache(userId?: string | null) {
  if (!userId) {
    followListCache.clear();
    return;
  }

  followListCache.deleteByPrefix(`${userId}:`);
}

export function getMyProfileApi() {
  return apiClient("/profiles/me") as Promise<Profile>;
}

export function updateMyProfileApi(data: UpdateProfileInput) {
  return apiClient("/profiles/me", {
    method: "PUT",
    body: JSON.stringify(data),
  }) as Promise<Profile>;
}

export function getPublicProfileApi(userId: string) {
  return publicProfileCache.get(userId, () =>
    apiClient(`/profiles/${encodeURIComponent(userId)}`) as Promise<PublicProfileResponse>,
  );
}

function invalidateFollowMutationCaches(targetUserId: string, viewerUserId?: string | null) {
  invalidatePublicProfileCache(targetUserId);

  if (viewerUserId && viewerUserId !== targetUserId) {
    invalidatePublicProfileCache(viewerUserId);
  }

  invalidateProfileFollowListCache();
}

export async function followProfileApi(userId: string, viewerUserId?: string | null) {
  const result = (await apiClient(`/profiles/${encodeURIComponent(userId)}/follow`, {
    method: "POST",
  })) as ProfileFollowMutationResponse;

  invalidateFollowMutationCaches(userId, viewerUserId);
  return result;
}

export async function unfollowProfileApi(userId: string, viewerUserId?: string | null) {
  const result = (await apiClient(`/profiles/${encodeURIComponent(userId)}/follow`, {
    method: "DELETE",
  })) as ProfileFollowMutationResponse;

  invalidateFollowMutationCaches(userId, viewerUserId);
  return result;
}

export function getProfileFollowListApi(
  userId: string,
  kind: ProfileFollowListKind,
  options: { cursor?: string | null; limit?: number } = {},
) {
  const params = new URLSearchParams();

  if (options.cursor) {
    params.set("cursor", options.cursor);
  }

  if (options.limit) {
    params.set("limit", String(options.limit));
  }

  const encodedUserId = encodeURIComponent(userId);
  const query = params.toString();
  const path = `/profiles/${encodedUserId}/${kind}${query ? `?${query}` : ""}`;
  const cacheKey = `${userId}:${kind}:${options.cursor ?? ""}:${options.limit ?? ""}`;

  return followListCache.get(cacheKey, () =>
    apiClient(path) as Promise<ProfileFollowListPage>,
  );
}

export function searchProfilesApi(
  query: string,
  limit: number = 8,
  signal?: AbortSignal,
) {
  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
  });

  return apiClient(`/profiles/search?${params}`, { signal }) as Promise<ProfileSearchResult[]>;
}
