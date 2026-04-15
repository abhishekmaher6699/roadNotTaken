import { apiClient } from "@/lib/api-client";
import {
  CreatePinInput,
  Pin,
  TileCoordinates,
  TilePinsResponse,
  TileSummariesResponse,
  UpdatePinInput,
} from "./types";

export function getPinsApi() {
  return apiClient("/pins") as Promise<Pin[]>;
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

export function searchPinsApi(
  query: string,
  limit: number = 6,
  viewport?: { north: number; south: number; east: number; west: number } | null,
  signal?: AbortSignal
) {
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  if (viewport) {
    params.set("north", String(viewport.north));
    params.set("south", String(viewport.south));
    params.set("east", String(viewport.east));
    params.set("west", String(viewport.west));
  }
  return apiClient(`/pins/search?${params}`, { signal }) as Promise<Pin[]>;
}
