import type {
  Pin,
  TileCacheEntry,
  TileCoordinates,
  TileSummaryCacheEntry,
} from "./types";
import {
  getChildTiles,
  getParentTile,
  getPinsPerTileLimit,
  isPinInsideTile,
  tileKey,
} from "./tile-utils";

// These caches are keyed by "z/x/y". Raw pin tiles and low-zoom summary tiles stay separate
// because they power different UI modes and have different payload shapes.
export type TileCache = Record<string, TileCacheEntry>;
export type TileSummaryCache = Record<string, TileSummaryCacheEntry>;

// We capture the previous entry before a request mutates it so aborted requests can restore state.
export type TileSnapshot = {
  key: string;
  entry: TileCacheEntry | undefined;
};

export type TileSummarySnapshot = {
  key: string;
  entry: TileSummaryCacheEntry | undefined;
};

// A short TTL keeps recent tiles warm while still allowing later refreshes.
export const TILE_CACHE_TTL_MS = 10 * 60 * 1000;

export const EMPTY_TILE_ENTRY: TileCacheEntry = {
  pins: [],
  status: "idle",
  fetchedAt: null,
};

export const EMPTY_TILE_SUMMARY_ENTRY: TileSummaryCacheEntry = {
  summary: null,
  status: "idle",
  fetchedAt: null,
};

// Every cache read goes through this helper so missing tiles behave consistently.
export function getTileEntry(cache: TileCache, tile: TileCoordinates) {
  return cache[tileKey(tile)] ?? EMPTY_TILE_ENTRY;
}

// We keep empty tiles too, so repeated pans over sparse areas do not keep hitting the API.
export function isTileEntryFresh(
  entry?: { status: "idle" | "loading" | "ready" | "error"; fetchedAt: number | null }
) {
  return (
    !!entry &&
    entry.status === "ready" &&
    entry.fetchedAt !== null &&
    Date.now() - entry.fetchedAt < TILE_CACHE_TTL_MS
  );
}

export function mergePinsIntoTiles(
  cache: TileCache,
  tiles: TileCoordinates[],
  pins: Pin[]
) {
  // The backend returns one flat pin list for the whole request. We split that list back into
  // per-tile cache entries here so later pans and zooms can reuse exact tile results.
  // How:
  // - Iterate over each tile that was part of the request.
  // - For that tile, filter the flat pin array with `isPinInsideTile`.
  // - Store just that tile's pins in the cache entry.
  // - Mark the tile `ready` and stamp a fresh `fetchedAt`.
  const nextCache = { ...cache };

  tiles.forEach((tile) => {
    const key = tileKey(tile);
    nextCache[key] = {
      pins: pins.filter((pin) => isPinInsideTile(pin, tile)),
      status: "ready",
      fetchedAt: Date.now(),
    };
  });

  return nextCache;
}

// While an exact tile is loading, we can still render parent-tile pins as a soft fallback.
export function collectAncestorPins(cache: TileCache, tile: TileCoordinates) {
  // Walk up the tile pyramid until we find the nearest ready parent tile.
  // How:
  // - Start at the direct parent.
  // - At each step, read that parent's cache entry.
  // - If the parent is ready, keep only the pins whose coordinates still fall inside the child tile.
  // - If not, move one more level upward and try again.
  let currentParent = getParentTile(tile);

  while (currentParent) {
    const parentEntry = getTileEntry(cache, currentParent);

    if (parentEntry.status === "ready") {
      return parentEntry.pins.filter((pin) => isPinInsideTile(pin, tile));
    }

    currentParent = getParentTile(currentParent);
  }

  return [];
}

// When zooming back out, cached child tiles can still give us something useful immediately.
export function collectChildPins(cache: TileCache, tile: TileCoordinates) {
  // This is the opposite direction: use any ready children to avoid an empty map while the
  // parent tile is still being derived or fetched.
  // How:
  // - Get the four direct child tiles.
  // - Gather pins from every ready child entry.
  // - Deduplicate them by pin id.
  // - Filter them back down to the parent tile bounds.
  const childTiles = getChildTiles(tile);
  const childPins = childTiles.flatMap((childTile) => {
    const childEntry = getTileEntry(cache, childTile);
    return childEntry.status === "ready" ? childEntry.pins : [];
  });

  if (childPins.length === 0) {
    return [];
  }

  const uniquePins = new Map<string, Pin>();
  childPins.forEach((pin) => {
    uniquePins.set(pin.id, pin);
  });

  return Array.from(uniquePins.values()).filter((pin) => isPinInsideTile(pin, tile));
}

// Frontend ranking mirrors the backend so derived parent tiles behave like fetched ones.
export function comparePinsForRanking(a: Pin, b: Pin) {
  // Score is the main ranking signal for now. Time and id only break ties predictably.
  // How:
  // - Compare score descending first.
  // - If tied, compare created_at descending.
  // - If still tied, compare id so sort order is stable.
  const scoreDifference = (b.score ?? 0) - (a.score ?? 0);
  if (scoreDifference !== 0) {
    return scoreDifference;
  }

  const createdAtDifference =
    new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime();
  if (createdAtDifference !== 0) {
    return createdAtDifference;
  }

  return String(b.id).localeCompare(String(a.id));
}

// If all child tiles are cached, we can synthesize the parent tile locally and skip a request.
export function deriveParentTileEntryFromChildren(
  cache: TileCache,
  tile: TileCoordinates
) {
  // We only derive a parent when all four direct children are ready, so the synthesized result
  // matches what the backend would have seen for that parent area.
  // How:
  // - Read the four child entries.
  // - Refuse to derive if any child is not ready.
  // - Merge all child pins into one deduplicated map.
  // - Keep only pins inside the parent tile bounds.
  // - Re-rank with the same client ranking function.
  // - Slice to the parent tile's own per-tile limit.
  const childTiles = getChildTiles(tile);
  const childEntries = childTiles.map((childTile) => getTileEntry(cache, childTile));

  if (childEntries.some((entry) => entry.status !== "ready")) {
    return null;
  }

  const uniquePins = new Map<string, Pin>();

  childEntries.forEach((entry) => {
    entry.pins.forEach((pin) => {
      if (isPinInsideTile(pin, tile)) {
        uniquePins.set(pin.id, pin);
      }
    });
  });

  // After merging children, re-rank and apply the parent tile's own pin cap.
  const rankedPins = Array.from(uniquePins.values())
    .sort(comparePinsForRanking)
    .slice(0, getPinsPerTileLimit(tile.z));

  return {
    pins: rankedPins,
    status: "ready" as const,
    fetchedAt: Date.now(),
  };
}
