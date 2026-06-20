import { apiClient } from "@/lib/api-client";
import { createAsyncCache } from "@/lib/async-cache";
import type {
  Profile,
  ProfileFollowMutationResponse,
  ProfileSearchResult,
  PublicProfileResponse,
  UpdateProfileInput,
} from "./types";

const PUBLIC_PROFILE_CACHE_TTL_MS = 15_000;
const publicProfileCache = createAsyncCache<PublicProfileResponse>(
  PUBLIC_PROFILE_CACHE_TTL_MS,
);

export function invalidatePublicProfileCache(userId?: string | null) {
  if (!userId) {
    publicProfileCache.clear();
    return;
  }

  publicProfileCache.delete(userId);
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

export async function followProfileApi(userId: string) {
  const result = (await apiClient(`/profiles/${encodeURIComponent(userId)}/follow`, {
    method: "POST",
  })) as ProfileFollowMutationResponse;

  invalidatePublicProfileCache(userId);
  return result;
}

export async function unfollowProfileApi(userId: string) {
  const result = (await apiClient(`/profiles/${encodeURIComponent(userId)}/follow`, {
    method: "DELETE",
  })) as ProfileFollowMutationResponse;

  invalidatePublicProfileCache(userId);
  return result;
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
