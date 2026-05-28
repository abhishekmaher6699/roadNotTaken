import type {
  Pin,
  TileCoordinates,
  TileSummary,
  TileSummaryCacheEntry,
} from "../types";
import { tileKey } from "./tile-utils";
import {
  collectAncestorPins,
  collectChildPins,
  EMPTY_TILE_SUMMARY_ENTRY,
  getTileEntry,
  TileCache,
  TileSummaryCache,
} from "./tile-cache";

// Visible pins come from exact ready tiles first, then from parent/child fallbacks while exact tiles load.
export function selectVisiblePins(
  tileCache: TileCache,
  activeTiles: TileCoordinates[],
) {
  // A Map keyed by pin id prevents duplicate rendering when fallback sources overlap.
  // How:
  // - Loop through every currently active tile.
  // - If the exact tile is ready, use its pins immediately.
  // - If not, ask ancestor/child fallback helpers for temporary pins.
  // - Write each pin into the map by id so duplicates collapse automatically.
  const visiblePins = new Map<string, Pin>();

  activeTiles.forEach((tile) => {
    const entry = getTileEntry(tileCache, tile);

    if (entry.status === "ready") {
      entry.pins.forEach((pin) => visiblePins.set(pin.id, pin));
      return;
    }

    const fallbackPins = [
      ...collectAncestorPins(tileCache, tile),
      ...collectChildPins(tileCache, tile),
    ];

    fallbackPins.forEach((pin) => visiblePins.set(pin.id, pin));
  });

  return Array.from(visiblePins.values());
}

function getSummaryEntry(cache: TileSummaryCache, tile: TileCoordinates) {
  return cache[tileKey(tile)] ?? EMPTY_TILE_SUMMARY_ENTRY;
}

// Summary tiles are simpler: we only show exact ready summaries for the currently active low-zoom tiles.
export function selectVisibleTileSummaries(
  summaryCache: TileSummaryCache,
  activeSummaryTiles: TileCoordinates[],
) {
  // Summary markers are keyed by tile because each tile contributes at most one aggregate marker.
  // How:
  // - Loop through the currently active summary tiles.
  // - Read the exact cache entry for each tile.
  // - If that entry is ready and contains a summary, keep it.
  // - Return the final marker list as an array.
  const visibleSummaries = new Map<string, TileSummary>();

  activeSummaryTiles.forEach((tile) => {
    const entry: TileSummaryCacheEntry = getSummaryEntry(summaryCache, tile);

    if (entry.status === "ready" && entry.summary) {
      visibleSummaries.set(tileKey(tile), entry.summary);
    }
  });

  return Array.from(visibleSummaries.values()).sort((a, b) =>
    tileKey(a).localeCompare(tileKey(b)),
  );
}
