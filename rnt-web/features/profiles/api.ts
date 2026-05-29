import { apiClient } from "@/lib/api-client";
import type {
  Profile,
  ProfileSearchResult,
  PublicProfileResponse,
  UpdateProfileInput,
} from "./types";

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
  return apiClient(`/profiles/${encodeURIComponent(userId)}`) as Promise<PublicProfileResponse>;
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
