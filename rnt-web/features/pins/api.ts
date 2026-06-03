import { apiClient } from "@/lib/api-client";
import {
  CreatePinInput,
  Pin,
  TileCoordinates,
  TilePinsResponse,
  TileSummariesResponse,
  UpdatePinInput,
} from "./types";

export interface LikeMutationResponse {
  liked: boolean;
  likes_count: number;
}

export interface VisitMutationResponse {
  visited: boolean;
  visits_count: number;
}

export function getPinsApi() {
  return apiClient("/pins") as Promise<Pin[]>;
}

export function getPinApi(id: string) {
  return apiClient(`/pins/${encodeURIComponent(id)}`) as Promise<Pin>;
}

export function getPinsForTilesApi(
  tiles: TileCoordinates[],
  signal?: AbortSignal
) {
  return apiClient("/pins/tiles/query", {
    method: "POST",
    signal,
    body: JSON.stringify({ tiles }),
  }) as Promise<TilePinsResponse>;
}

export function getPinSummariesForTilesApi(
  tiles: TileCoordinates[],
  signal?: AbortSignal
) {
  return apiClient("/pins/tiles/summary", {
    method: "POST",
    signal,
    body: JSON.stringify({ tiles }),
  }) as Promise<TileSummariesResponse>;
}

export function createPinApi(data: CreatePinInput) {
  return apiClient("/pins", {
    method: "POST",
    body: JSON.stringify(data),
  }) as Promise<Pin>;
}

export function deletePinApi(id: string) {
  return apiClient(`/pins/${id}`, {
    method: "DELETE",
  }) as Promise<{ id: string }>;
}

export function updatePinApi(id: string, data: UpdatePinInput) {
  return apiClient(`/pins/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  }) as Promise<Pin>;
}

export function likePinApi(id: string, signal?: AbortSignal) {
  return apiClient(`/pins/${id}/like`, {
    method: "POST",
    signal,
  }) as Promise<LikeMutationResponse>;
}

export function unlikePinApi(id: string, signal?: AbortSignal) {
  return apiClient(`/pins/${id}/like`, {
    method: "DELETE",
    signal,
  }) as Promise<LikeMutationResponse>;
}

export function visitPinApi(id: string) {
  return apiClient(`/pins/${id}/visit`, {
    method: "POST",
  }) as Promise<VisitMutationResponse>;
}

export function unvisitPinApi(id: string) {
  return apiClient(`/pins/${id}/visit`, {
    method: "DELETE",
  }) as Promise<VisitMutationResponse>;
}

export function searchPinsApi(
  query: string,
  limit: number = 6,
  center?: { lat: number; lng: number },
  signal?: AbortSignal
) {
  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
  });

  if (center) {
    params.append("lat", String(center.lat));
    params.append("lng", String(center.lng));
  }

  return apiClient(`/pins/search?${params}`, { signal }) as Promise<Pin[]>;
}
