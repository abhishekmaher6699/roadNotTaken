import type {
  Dispatch,
  MutableRefObject,
  RefObject,
  SetStateAction,
} from "react";
import { getPinSummariesForTilesApi, getPinsForTilesApi } from "../api";
import type { TileCoordinates } from "../types";
import { getPrefetchTiles, tileKey } from "./tile-utils";
import type { ViewportBounds } from "./tile-utils";
import {
  deriveParentTileEntryFromChildren,
  EMPTY_TILE_ENTRY,
  EMPTY_TILE_SUMMARY_ENTRY,
  isTileEntryFresh,
  mergePinsIntoTiles,
  TileCache,
  TileSnapshot,
  TileSummaryCache,
  TileSummarySnapshot,
} from "./tile-cache";

// Prefetch is deliberately conservative. It only runs when the user is zoomed in enough and
// the viewport is small enough that fetching one extra outer ring is still cheap.
export const MIN_PREFETCH_ZOOM = 13;
export const MAX_PREFETCH_VISIBLE_TILES = 9;

// This bundle is everything the raw-pin request pipeline needs from the hook.
export type RawTileRequestState = {
  inFlightTilesRef: RefObject<Set<string>>;
  tileCacheRef: RefObject<TileCache>;
  activeRequestRef: RefObject<{
    controller: AbortController;
    requestId: number;
    tileSnapshots: TileSnapshot[];
  } | null>;
  requestIdRef: RefObject<number>;
  requestStatsRef: RefObject<{
    started: number;
    completed: number;
    aborted: number;
  }>;
  setTileCache: Dispatch<SetStateAction<TileCache>>;
};

// Summary requests use a separate state bundle so they never interfere with detailed pin traffic.
export type SummaryTileRequestState = {
  inFlightSummaryTilesRef: RefObject<Set<string>>;
  summaryCacheRef: RefObject<TileSummaryCache>;
  activeSummaryRequestRef: RefObject<{
    controller: AbortController;
    requestId: number;
    tileSnapshots: TileSummarySnapshot[];
  } | null>;
  summaryRequestIdRef: RefObject<number>;
  setSummaryCache: Dispatch<SetStateAction<TileSummaryCache>>;
};

function dedupeTiles(tiles: TileCoordinates[]) {
  // Visible tiles and prefetch tiles can overlap, so we collapse them by z/x/y key.
  return tiles.filter(
    (tile, index, allTiles) =>
      index ===
      allTiles.findIndex((candidate) => tileKey(candidate) === tileKey(tile)),
  );
}

export function getRequestedTiles(
  visibleTiles: TileCoordinates[],
  bounds?: ViewportBounds,
) {
  // Visible tiles are always fetched first; prefetch only adds a small outer ring when it is cheap.
  // How:
  // 1. Inspect the current visible tile set.
  // 2. Decide whether prefetch is allowed at this zoom and viewport size.
  // 3. If yes, compute the outer ring with `getPrefetchTiles`.
  // 4. Merge visible + prefetch tiles.
  // 5. Deduplicate by z/x/y key so one tile is requested once.
  const shouldPrefetch =
    !!bounds &&
    (visibleTiles[0]?.z ?? 0) >= MIN_PREFETCH_ZOOM &&
    visibleTiles.length <= MAX_PREFETCH_VISIBLE_TILES;

  const prefetchTiles =
    shouldPrefetch && bounds
      ? getPrefetchTiles(bounds, visibleTiles[0]?.z ?? 0)
      : [];

  return dedupeTiles([...visibleTiles, ...prefetchTiles]);
}

export function primeDerivedParentTiles(
  requestedTiles: TileCoordinates[],
  setTileCache: Dispatch<SetStateAction<TileCache>>,
  tileCacheRef: RefObject<TileCache>,
) {
  // Before hitting the network, try to build any missing parent tiles from already-ready child tiles.
  // This is the main optimization that reduces zoom-out requests.
  // How:
  // 1. Loop over every tile we are about to request.
  // 2. Skip tiles that are already healthy in cache.
  // 3. For idle/error tiles, try `deriveParentTileEntryFromChildren`.
  // 4. If all four children exist and are ready, synthesize the parent locally.
  // 5. Write the derived result back into the cache/ref so later missing-tile checks can see it.
  setTileCache((current) => {
    const nextCache = { ...current };

    requestedTiles.forEach((tile) => {
      const key = tileKey(tile);

      if (
        !nextCache[key] ||
        nextCache[key].status === "idle" ||
        nextCache[key].status === "error"
      ) {
        const derivedEntry = deriveParentTileEntryFromChildren(nextCache, tile);

        if (derivedEntry) {
          nextCache[key] = derivedEntry;
        }
      }
    });

    tileCacheRef.current = nextCache;
    return nextCache;
  });
}

export function getMissingRawTiles(
  requestedTiles: TileCoordinates[],
  tileCacheRef: MutableRefObject<TileCache>,
  inFlightTilesRef: MutableRefObject<Set<string>>,
) {
  // We skip tiles that are fresh or already being fetched by the active request.
  // How:
  // 1. Read the latest tile entry from the mutable cache ref.
  // 2. Ask `isTileEntryFresh` whether that entry is still reusable.
  // 3. Also check whether the tile key is already in the in-flight set.
  // 4. Only return tiles that are stale/missing/error and not currently being requested.
  return requestedTiles.filter((tile) => {
    const key = tileKey(tile);
    const entry = tileCacheRef.current[key];

    return (
      (!isTileEntryFresh(entry) || entry.status === "error") &&
      !inFlightTilesRef.current.has(key)
    );
  });
}

export async function fetchRawTiles(
  missingTiles: TileCoordinates[],
  state: RawTileRequestState,
) {
  if (missingTiles.length === 0) {
    return;
  }

  // The latest viewport wins. Older raw-pin requests are cancelled before starting a new one.
  // How:
  // 1. Abort the previous controller.
  // 2. Remove its tile keys from the in-flight set.
  // 3. Clear the active request ref.
  // 4. Count it as aborted for dev logging.
  if (state.activeRequestRef.current) {
    state.activeRequestRef.current.controller.abort();
    state.activeRequestRef.current.tileSnapshots.forEach(({ key }) => {
      state.inFlightTilesRef.current.delete(key);
    });
    state.activeRequestRef.current = null;
    state.requestStatsRef.current.aborted += 1;
    // console.info("[pins] tile request aborted", {
    //   started: state.requestStatsRef.current.started,
    //   completed: state.requestStatsRef.current.completed,
    //   aborted: state.requestStatsRef.current.aborted,
    // });
  }

  // We snapshot old entries so an AbortError can restore the cache exactly as it was before.
  // How:
  // 1. Allocate a new AbortController.
  // 2. Generate a monotonically increasing request id.
  // 3. Save the previous cache entry for every tile we are about to mutate.
  // 4. Store all of that in `activeRequestRef` so later code can detect stale responses.
  const controller = new AbortController();
  const requestId = state.requestIdRef.current + 1;
  state.requestIdRef.current = requestId;
  const tileSnapshots = missingTiles.map((tile) => {
    const key = tileKey(tile);
    return {
      key,
      entry: state.tileCacheRef.current[key],
    };
  });

  state.activeRequestRef.current = {
    controller,
    requestId,
    tileSnapshots,
  };
  state.requestStatsRef.current.started += 1;
  // console.info("[pins] tile request started", {
  //   requestId,
  //   tileCount: missingTiles.length,
  //   started: state.requestStatsRef.current.started,
  //   completed: state.requestStatsRef.current.completed,
  //   aborted: state.requestStatsRef.current.aborted,
  // });

  state.setTileCache((current) => {
    const nextCache = { ...current };

    // Mark tiles as loading but keep any old pins so the UI can continue using fallback content.
    // How:
    // - We keep previous `pins` and `fetchedAt` when present.
    // - Only the status flips to `loading`.
    // - That lets the selectors still render ancestor/child fallbacks while the request is in flight.
    missingTiles.forEach((tile) => {
      const key = tileKey(tile);
      const existingEntry = nextCache[key];

      nextCache[key] = {
        pins: existingEntry?.pins ?? [],
        status: "loading",
        fetchedAt: existingEntry?.fetchedAt ?? null,
      };
    });

    state.tileCacheRef.current = nextCache;
    return nextCache;
  });

  missingTiles.forEach((tile) =>
    state.inFlightTilesRef.current.add(tileKey(tile)),
  );

  try {
    const response = await getPinsForTilesApi(missingTiles, controller.signal);

    // Ignore late responses from requests that were superseded by a newer viewport.
    // How:
    // - Compare the current active request id with the id captured when this request started.
    // - If they do not match, the viewport moved again and this response is stale.
    if (
      !state.activeRequestRef.current ||
      state.activeRequestRef.current.requestId !== requestId
    ) {
      return;
    }
    const fetchedTiles = response.tiles ?? missingTiles;

    state.setTileCache((current) => {
      // `mergePinsIntoTiles` takes the one flat backend result array and redistributes pins
      // back into their specific tile cache entries by checking `isPinInsideTile`.
      const nextCache = mergePinsIntoTiles(
        current,
        fetchedTiles,
        response.pins ?? [],
      );
      state.tileCacheRef.current = nextCache;
      return nextCache;
    });
    state.requestStatsRef.current.completed += 1;
    // console.info("[pins] tile request completed", {
    //   requestId,
    //   tileCount: fetchedTiles.length,
    //   pinCount: response.pins?.length ?? 0,
    //   started: state.requestStatsRef.current.started,
    //   completed: state.requestStatsRef.current.completed,
    //   aborted: state.requestStatsRef.current.aborted,
    // });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      state.setTileCache((current) => {
        const nextCache = { ...current };

        // Abort means "obsolete", not "broken", so we roll back to the previous tile state.
        // How:
        // - Each tile reuses the snapshot captured before the request set it to loading.
        // - If the tile had no previous entry, we restore the shared empty entry instead.
        tileSnapshots.forEach(({ key, entry }) => {
          nextCache[key] = entry ?? EMPTY_TILE_ENTRY;
        });

        state.tileCacheRef.current = nextCache;
        return nextCache;
      });

      return;
    }

    state.setTileCache((current) => {
      const nextCache = { ...current };

      // Real failures are marked as error so the next movement can retry them deliberately.
      // How:
      // - We preserve any previously known pins.
      // - We only change the status to `error`, which makes the tile eligible for a later retry.
      missingTiles.forEach((tile) => {
        const key = tileKey(tile);
        const existingEntry = nextCache[key];

        nextCache[key] = {
          pins: existingEntry?.pins ?? [],
          status: "error",
          fetchedAt: existingEntry?.fetchedAt ?? null,
        };
      });

      state.tileCacheRef.current = nextCache;
      return nextCache;
    });
  } finally {
    missingTiles.forEach((tile) =>
      state.inFlightTilesRef.current.delete(tileKey(tile)),
    );
    if (state.activeRequestRef.current?.requestId === requestId) {
      state.activeRequestRef.current = null;
    }
  }
}

export function getMissingSummaryTiles(
  tiles: TileCoordinates[],
  summaryCacheRef: MutableRefObject<TileSummaryCache>,
  inFlightSummaryTilesRef: MutableRefObject<Set<string>>,
) {
  // Summary tiles follow the same freshness rule as raw tiles, just against a different cache.
  // How:
  // - Look up the tile in the summary cache.
  // - Reuse it if it is fresh.
  // - Skip it if it is already in-flight.
  // - Otherwise include it in the summary request batch.
  return tiles.filter((tile) => {
    const key = tileKey(tile);
    const entry = summaryCacheRef.current[key];

    return (
      (!isTileEntryFresh(entry) || entry.status === "error") &&
      !inFlightSummaryTilesRef.current.has(key)
    );
  });
}

export async function fetchSummaryTiles(
  missingTiles: TileCoordinates[],
  state: SummaryTileRequestState,
) {
  if (missingTiles.length === 0) {
    return;
  }

  // Summary requests are isolated from raw-pin requests so low-zoom discovery stays predictable.
  // How:
  // - Summary requests have their own controller/ref/in-flight set.
  // - Cancelling a summary request does not touch raw pin requests, and vice versa.
  if (state.activeSummaryRequestRef.current) {
    state.activeSummaryRequestRef.current.controller.abort();
    state.activeSummaryRequestRef.current.tileSnapshots.forEach(({ key }) => {
      state.inFlightSummaryTilesRef.current.delete(key);
    });
    state.activeSummaryRequestRef.current = null;
  }

  // Summary requests are simpler than raw pin requests, but they still snapshot old entries so
  // an abort can restore the previous low-zoom marker state.
  // How:
  // - Capture the current summary entry for every tile.
  // - Set those tiles to loading.
  // - If this request is later aborted, restore those captured entries.
  const controller = new AbortController();
  const requestId = state.summaryRequestIdRef.current + 1;
  state.summaryRequestIdRef.current = requestId;
  const tileSnapshots = missingTiles.map((tile) => {
    const key = tileKey(tile);
    return {
      key,
      entry: state.summaryCacheRef.current[key],
    };
  });

  state.activeSummaryRequestRef.current = {
    controller,
    requestId,
    tileSnapshots,
  };

  state.setSummaryCache((current) => {
    const nextCache = { ...current };

    // Keep the old summary around until the replacement arrives, which reduces low-zoom flicker.
    // How:
    // - Reuse the previous `summary` payload if it exists.
    // - Only change status to `loading`.
    missingTiles.forEach((tile) => {
      const key = tileKey(tile);
      const existingEntry = nextCache[key];

      nextCache[key] = {
        summary: existingEntry?.summary ?? null,
        status: "loading",
        fetchedAt: existingEntry?.fetchedAt ?? null,
      };
    });

    state.summaryCacheRef.current = nextCache;
    return nextCache;
  });

  missingTiles.forEach((tile) =>
    state.inFlightSummaryTilesRef.current.add(tileKey(tile)),
  );

  try {
    const response = await getPinSummariesForTilesApi(
      missingTiles,
      controller.signal,
    );

    if (
      !state.activeSummaryRequestRef.current ||
      state.activeSummaryRequestRef.current.requestId !== requestId
    ) {
      return;
    }

    const summaryMap = new Map(
      (response.summaries ?? []).map((summary) => [tileKey(summary), summary]),
    );
    // `summaryMap` makes it easy to restore the backend response back into per-tile cache entries.
    const fetchedTiles = response.tiles ?? missingTiles;

    state.setSummaryCache((current) => {
      const nextCache = { ...current };

      // Each summary tile stores one aggregate marker payload instead of a whole pin list.
      // How:
      // - Use the requested/fetched tile key.
      // - Look up that tile's aggregate marker in `summaryMap`.
      // - Store that marker or `null` if the tile had no pins.
      fetchedTiles.forEach((tile) => {
        const key = tileKey(tile);
        const summary = summaryMap.get(key);

        nextCache[key] = {
          summary: summary ?? null,
          status: "ready",
          fetchedAt: Date.now(),
        };
      });

      state.summaryCacheRef.current = nextCache;
      return nextCache;
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      state.setSummaryCache((current) => {
        const nextCache = { ...current };

        // Restore the exact previous summary state when this request is superseded.
        // How:
        // - Replay the cached snapshot entries taken before the request started.
        tileSnapshots.forEach(({ key, entry }) => {
          nextCache[key] = entry ?? EMPTY_TILE_SUMMARY_ENTRY;
        });

        state.summaryCacheRef.current = nextCache;
        return nextCache;
      });

      return;
    }

    state.setSummaryCache((current) => {
      const nextCache = { ...current };

      // Error entries are cached too, which avoids immediately hammering the same failing tiles.
      // How:
      // - Preserve any previous summary.
      // - Flip the status to `error`.
      // - That makes later view changes retry intentionally instead of immediately looping.
      missingTiles.forEach((tile) => {
        const key = tileKey(tile);
        const existingEntry = nextCache[key];

        nextCache[key] = {
          summary: existingEntry?.summary ?? null,
          status: "error",
          fetchedAt: existingEntry?.fetchedAt ?? null,
        };
      });

      state.summaryCacheRef.current = nextCache;
      return nextCache;
    });
  } finally {
    missingTiles.forEach((tile) =>
      state.inFlightSummaryTilesRef.current.delete(tileKey(tile)),
    );
    if (state.activeSummaryRequestRef.current?.requestId === requestId) {
      state.activeSummaryRequestRef.current = null;
    }
  }
}
