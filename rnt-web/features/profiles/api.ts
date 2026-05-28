import { apiClient } from "@/lib/api-client";
import type {
  Profile,
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
