import { useMemo, useRef, useState } from "react";
import {
  createPinApi,
  deletePinApi,
  likePinApi,
  unlikePinApi,
  updatePinApi,
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
  
  const requestStatsRef = useRef({
    started: 0,
    completed: 0,
    aborted: 0,
  });
  const likeControllersRef = useRef<Map<string, AbortController>>(new Map());
  const likeRequestIdsRef = useRef<Map<string, number>>(new Map());

  // The hook exposes already-selected map content. The heavy tile decisions live in helper files.
  const pins = useMemo(
    () => selectVisiblePins(tileCache, activeTiles),
    [activeTiles, tileCache]
  );

  const tileSummaries = useMemo(
    () => selectVisibleTileSummaries(summaryCache, activeSummaryTiles),
    [activeSummaryTiles, summaryCache]
  );

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
    setActiveSummaryTiles(tiles);

    await fetchSummaryTiles(
      getMissingSummaryTiles(tiles, summaryCacheRef, inFlightSummaryTilesRef),
      {
        inFlightSummaryTilesRef,
        summaryCacheRef,
        activeSummaryRequestRef,
        summaryRequestIdRef,
        setSummaryCache,
      }
    );
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

  const addPin = async (data: CreatePinInput) => {
    const newPin = await createPinApi(data);
    // Mutations patch the local tile cache so the map does not wait for a refetch to stay accurate.
    syncPinIntoCache(newPin);
    return newPin;
  };

  const removePin = async (id: string) => {
    await deletePinApi(id);
    removePinFromCache(id);
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

    patchPinInCache(pinId, () => optimisticPin);

    const requestId = (likeRequestIdsRef.current.get(pinId) ?? 0) + 1;
    likeRequestIdsRef.current.set(pinId, requestId);
    const controller = new AbortController();
    likeControllersRef.current.set(pinId, controller);

    try {
      const result = optimisticPin.viewer_has_liked
        ? await likePinApi(pinId, controller.signal)
        : await unlikePinApi(pinId, controller.signal);

      if (likeRequestIdsRef.current.get(pinId) !== requestId) {
        return optimisticPin;
      }

      const resolvedPin: Pin = {
        ...optimisticPin,
        viewer_has_liked: result.liked,
        likes_count: result.likes_count,
      };

      patchPinInCache(pinId, () => resolvedPin);
      return resolvedPin;
    } catch (error) {
      if (isAbortError(error)) {
        return null;
      }

      if (likeRequestIdsRef.current.get(pinId) === requestId) {
        patchPinInCache(pinId, () => previousPin);
      }

      throw error;
    } finally {
      if (likeRequestIdsRef.current.get(pinId) === requestId) {
        likeControllersRef.current.delete(pinId);
      }
    }
  };

  return {
    pins,
    tileSummaries,
    addPin,
    editPin,
    removePin,
    togglePinLike,
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
