import { useMemo, useRef, useState } from "react";
import {
  createPinApi,
  deletePinApi,
  likePinApi,
  unlikePinApi,
  unvisitPinApi,
  updatePinApi,
  visitPinApi,
} from "./api";
import type {
  CreatePinInput,
  Pin,
  TileCoordinates,
  UpdatePinInput,
} from "./types";
import { isPinInsideTile } from "./tiles/tile-utils";
import type { ViewportBounds } from "./tiles/tile-utils";
import {
  TileCache,
  TileSummaryCache,
  TileSnapshot,
  TileSummarySnapshot,
} from "./tiles/tile-cache";
import { selectVisiblePins, selectVisibleTileSummaries } from "./tiles/tile-selectors";
import {
  fetchRawTiles,
  fetchSummaryTiles,
  getMissingRawTiles,
  getMissingSummaryTiles,
  getRequestedTiles,
  primeDerivedParentTiles,
} from "./tiles/tile-requests";

import type { MapViewport } from "@/types/mapTypes";

const LIKE_FLUSH_DELAY_MS = 500;

function getSocialScore(
  pin: Pick<Pin, "likes_count" | "comment_count" | "visits_count">,
) {
  return pin.likes_count + pin.comment_count * 2 + pin.visits_count;
}

function areSummaryListsEqual(
  current: ReturnType<typeof selectVisibleTileSummaries>,
  next: ReturnType<typeof selectVisibleTileSummaries>,
) {
  if (current.length !== next.length) {
    return false;
  }

  return current.every((summary, index) => {
    const candidate = next[index];

    return (
      summary.x === candidate.x &&
      summary.y === candidate.y &&
      summary.z === candidate.z &&
      summary.latitude === candidate.latitude &&
      summary.longitude === candidate.longitude &&
      summary.pin_count === candidate.pin_count &&
      summary.top_score === candidate.top_score
    );
  });
}

interface PendingLikeMutation {
  basePin: Pin;
  timer: ReturnType<typeof setTimeout>;
  controller: AbortController | null;
  resolve: (pin: Pin | null) => void;
}

export function usePins() {
  const [tileCache, setTileCache] = useState<TileCache>({});
  const [activeTiles, setActiveTiles] = useState<TileCoordinates[]>([]);
  const [summaryCache, setSummaryCache] = useState<TileSummaryCache>({});
  const [activeSummaryTiles, setActiveSummaryTiles] = useState<TileCoordinates[]>([]);
  const inFlightTilesRef = useRef<Set<string>>(new Set());
  const inFlightSummaryTilesRef = useRef<Set<string>>(new Set());
  const tileCacheRef = useRef<TileCache>({});
  const summaryCacheRef = useRef<TileSummaryCache>({});
  
  const activeRequestRef = useRef<{
    controller: AbortController;
    requestId: number;
    tileSnapshots: TileSnapshot[];
  } | null>(null);

  const activeSummaryRequestRef = useRef<{
    controller: AbortController;
    requestId: number;
    tileSnapshots: TileSummarySnapshot[];
  } | null>(null);
  
  const requestIdRef = useRef(0);
  const summaryRequestIdRef = useRef(0);
  const summaryTileSelectionIdRef = useRef(0);
  
  const requestStatsRef = useRef({
    started: 0,
    completed: 0,
    aborted: 0,
  });
  const likeControllersRef = useRef<Map<string, AbortController>>(new Map());
  const likeRequestIdsRef = useRef<Map<string, number>>(new Map());
  const pendingLikeMutationsRef = useRef<Map<string, PendingLikeMutation>>(new Map());

  // The hook exposes already-selected map content. The heavy tile decisions live in helper files.
  const pins = useMemo(
    () => selectVisiblePins(tileCache, activeTiles),
    [activeTiles, tileCache]
  );

  const previousTileSummariesRef = useRef<
    ReturnType<typeof selectVisibleTileSummaries>
  >([]);
  const tileSummaries = useMemo(() => {
    const nextSummaries = selectVisibleTileSummaries(
      summaryCache,
      activeSummaryTiles,
    );

    if (areSummaryListsEqual(previousTileSummariesRef.current, nextSummaries)) {
      return previousTileSummariesRef.current;
    }

    previousTileSummariesRef.current = nextSummaries;
    return nextSummaries;
  }, [activeSummaryTiles, summaryCache]);

  const loadTiles = async (
    visibleTiles: TileCoordinates[],
    bounds?: ViewportBounds
  ) => {
    setActiveTiles(visibleTiles);
    const requestedTiles = getRequestedTiles(visibleTiles, bounds);

    // Before going to the network, try to synthesize parent tiles from ready child tiles.
    primeDerivedParentTiles(requestedTiles, setTileCache, tileCacheRef);

    await fetchRawTiles(
      getMissingRawTiles(requestedTiles, tileCacheRef, inFlightTilesRef),
      {
        inFlightTilesRef,
        tileCacheRef,
        activeRequestRef,
        requestIdRef,
        requestStatsRef,
        setTileCache,
      }
    );
  };

  const loadTileSummaries = async (tiles: TileCoordinates[]) => {
    const selectionId = summaryTileSelectionIdRef.current + 1;
    summaryTileSelectionIdRef.current = selectionId;

    if (tiles.length === 0) {
      setActiveSummaryTiles([]);
      await fetchSummaryTiles([], {
        inFlightSummaryTilesRef,
        summaryCacheRef,
        activeSummaryRequestRef,
        summaryRequestIdRef,
        setSummaryCache,
      });
      return;
    }

    const missingTiles = getMissingSummaryTiles(
      tiles,
      summaryCacheRef,
      inFlightSummaryTilesRef
    );

    setActiveSummaryTiles(tiles);

    await fetchSummaryTiles(missingTiles, {
      inFlightSummaryTilesRef,
      summaryCacheRef,
      activeSummaryRequestRef,
      summaryRequestIdRef,
      setSummaryCache,
    });

    if (summaryTileSelectionIdRef.current === selectionId) {
      setActiveSummaryTiles(tiles);
    }
  };

  const syncPinIntoCache = (pin: Pin) => {
    setTileCache((current) => {
      const nextCache: TileCache = {};

      Object.entries(current).forEach(([key, entry]) => {
        const [z, x, y] = key.split("/").map(Number);
        const tile = { z, x, y };
        const nextPins = entry.pins.filter((existingPin) => existingPin.id !== pin.id);

        nextCache[key] = {
          ...entry,
          pins: isPinInsideTile(pin, tile) ? [...nextPins, pin] : nextPins,
        };
      });

      tileCacheRef.current = nextCache;
      return nextCache;
    });
  };

  const patchPinInCache = (
    pinId: string,
    updater: (pin: Pin) => Pin,
  ) => {
    setTileCache((current) => {
      const nextCache: TileCache = {};

      Object.entries(current).forEach(([key, entry]) => {
        nextCache[key] = {
          ...entry,
          pins: entry.pins.map((pin) => (pin.id === pinId ? updater(pin) : pin)),
        };
      });

      tileCacheRef.current = nextCache;
      return nextCache;
    });
  };

  const findPinInCache = (pinId: string) => {
    for (const entry of Object.values(tileCacheRef.current)) {
      const pin = entry.pins.find((candidate) => candidate.id === pinId);
      if (pin) {
        return pin;
      }
    }

    return null;
  };

  const isAbortError = (error: unknown) =>
    error instanceof Error && error.name === "AbortError";

  const removePinFromCache = (pinId: string) => {
    setTileCache((current) => {
      const nextCache: TileCache = {};

      Object.entries(current).forEach(([key, entry]) => {
        nextCache[key] = {
          ...entry,
          pins: entry.pins.filter((pin) => pin.id !== pinId),
        };
      });

      tileCacheRef.current = nextCache;
      return nextCache;
    });
  };

  const patchSummaryCountForPin = (pin: Pin, delta: number) => {
    setSummaryCache((current) => {
      const nextCache: TileSummaryCache = {};

      Object.entries(current).forEach(([key, entry]) => {
        const [z, x, y] = key.split("/").map(Number);
        const tile = { z, x, y };

        if (!entry.summary || !isPinInsideTile(pin, tile)) {
          nextCache[key] = entry;
          return;
        }

        const nextCount = Math.max(entry.summary.pin_count + delta, 0);

        nextCache[key] = {
          ...entry,
          summary:
            nextCount > 0
              ? {
                  ...entry.summary,
                  pin_count: nextCount,
                }
              : null,
        };
      });

      summaryCacheRef.current = nextCache;
      return nextCache;
    });
  };

  const updatePinCommentCount = (pinId: string, delta: number) => {
    patchPinInCache(pinId, (pin) => {
      const nextPin = {
        ...pin,
        comment_count: Math.max(pin.comment_count + delta, 0),
      };

      return {
        ...nextPin,
        score: getSocialScore(nextPin),
      };
    });
  };

  const setPinCommentCount = (pinId: string, count: number) => {
    patchPinInCache(pinId, (pin) => {
      const nextPin = {
        ...pin,
        comment_count: Math.max(count, 0),
      };

      return {
        ...nextPin,
        score: getSocialScore(nextPin),
      };
    });
  };

  const addPin = async (data: CreatePinInput) => {
    const newPin = await createPinApi(data);
    // Mutations patch the local tile cache so the map does not wait for a refetch to stay accurate.
    syncPinIntoCache(newPin);
    patchSummaryCountForPin(newPin, 1);
    return newPin;
  };

  const removePin = async (id: string, fallbackPin?: Pin) => {
    const pin = findPinInCache(id) ?? fallbackPin ?? null;

    await deletePinApi(id);
    removePinFromCache(id);

    if (pin) {
      patchSummaryCountForPin(pin, -1);
    }
  };

  const editPin = async (id: string, data: UpdatePinInput) => {
    const updatedPin = await updatePinApi(id, data);
    syncPinIntoCache(updatedPin);
    return updatedPin;
  };

  const togglePinLike = async (pinId: string, fallbackPin?: Pin) => {
    const previousPin = findPinInCache(pinId) ?? fallbackPin ?? null;

    if (!previousPin) {
      return null;
    }

    const previousController = likeControllersRef.current.get(pinId);
    previousController?.abort();

    const optimisticPin: Pin = {
      ...previousPin,
      viewer_has_liked: !previousPin.viewer_has_liked,
      likes_count: Math.max(
        previousPin.likes_count + (previousPin.viewer_has_liked ? -1 : 1),
        0,
      ),
    };
    optimisticPin.score = getSocialScore(optimisticPin);

    patchPinInCache(pinId, () => optimisticPin);

    const pendingMutation = pendingLikeMutationsRef.current.get(pinId);
    if (pendingMutation) {
      clearTimeout(pendingMutation.timer);
      pendingMutation.controller?.abort();
      pendingMutation.resolve(null);

      if (
        !pendingMutation.controller &&
        optimisticPin.viewer_has_liked === pendingMutation.basePin.viewer_has_liked
      ) {
        pendingLikeMutationsRef.current.delete(pinId);
        return optimisticPin;
      }
    }

    const requestId = (likeRequestIdsRef.current.get(pinId) ?? 0) + 1;
    likeRequestIdsRef.current.set(pinId, requestId);

    return new Promise<Pin | null>((resolve, reject) => {
      const timer = setTimeout(async () => {
        const controller = new AbortController();
        likeControllersRef.current.set(pinId, controller);

        const currentMutation = pendingLikeMutationsRef.current.get(pinId);
        if (currentMutation) {
          currentMutation.controller = controller;
        }

        try {
          const result = optimisticPin.viewer_has_liked
            ? await likePinApi(pinId, controller.signal)
            : await unlikePinApi(pinId, controller.signal);

          if (likeRequestIdsRef.current.get(pinId) !== requestId) {
            resolve(null);
            return;
          }

          const resolvedPin: Pin = {
            ...optimisticPin,
            viewer_has_liked: result.liked,
            likes_count: result.likes_count,
          };
          resolvedPin.score = getSocialScore(resolvedPin);

          patchPinInCache(pinId, () => resolvedPin);
          resolve(resolvedPin);
        } catch (error) {
          if (isAbortError(error)) {
            resolve(null);
            return;
          }

          if (likeRequestIdsRef.current.get(pinId) === requestId) {
            patchPinInCache(pinId, () => previousPin);
          }

          reject(error);
        } finally {
          if (likeRequestIdsRef.current.get(pinId) === requestId) {
            likeControllersRef.current.delete(pinId);
            pendingLikeMutationsRef.current.delete(pinId);
          }
        }
      }, LIKE_FLUSH_DELAY_MS);

      pendingLikeMutationsRef.current.set(pinId, {
        basePin: pendingMutation?.basePin ?? previousPin,
        timer,
        controller: null,
        resolve,
      });
    });
  };

  const togglePinVisit = async (pinId: string, fallbackPin?: Pin) => {
    const previousPin = findPinInCache(pinId) ?? fallbackPin ?? null;

    if (!previousPin) {
      return null;
    }

    const optimisticPin: Pin = {
      ...previousPin,
      viewer_has_visited: !previousPin.viewer_has_visited,
      visits_count: Math.max(
        previousPin.visits_count + (previousPin.viewer_has_visited ? -1 : 1),
        0,
      ),
    };
    optimisticPin.score = getSocialScore(optimisticPin);

    patchPinInCache(pinId, () => optimisticPin);

    try {
      const result = optimisticPin.viewer_has_visited
        ? await visitPinApi(pinId)
        : await unvisitPinApi(pinId);

      const resolvedPin: Pin = {
        ...optimisticPin,
        viewer_has_visited: result.visited,
        visits_count: result.visits_count,
      };
      resolvedPin.score = getSocialScore(resolvedPin);

      patchPinInCache(pinId, () => resolvedPin);
      return resolvedPin;
    } catch (error) {
      patchPinInCache(pinId, () => previousPin);
      throw error;
    }
  };

  return {
    pins,
    tileSummaries,
    addPin,
    editPin,
    removePin,
    togglePinLike,
    togglePinVisit,
    updatePinCommentCount,
    setPinCommentCount,
    loadTiles,
    loadTileSummaries,
  };
}


/**
 * When the search results panel is open, returns only pins visible in the
 * current viewport. Otherwise returns the normal map pin list.
 */
export function useDisplayedPins(
  pins: Pin[],
  searchResults: Pin[],
  isResultsPanelOpen: boolean,
  viewport: MapViewport | null
): Pin[] {
  return useMemo(() => {
    if (!isResultsPanelOpen) return pins;
    if (!viewport) return searchResults;

    return searchResults.filter(
      (p) =>
        p.latitude >= viewport.south &&
        p.latitude <= viewport.north &&
        p.longitude >= viewport.west &&
        p.longitude <= viewport.east
    );
  }, [pins, searchResults, isResultsPanelOpen, viewport]);
}
