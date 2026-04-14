import { useMemo, useRef, useState } from "react";
import {
  createPinApi,
  deletePinApi,
  getPinSummariesForTilesApi,
  getPinsForTilesApi,
  updatePinApi,
} from "./api";
import type {
  CreatePinInput,
  Pin,
  TileCacheEntry,
  TileCoordinates,
  TileSummary,
  TileSummaryCacheEntry,
  UpdatePinInput,
} from "./types";
import {
  getChildTiles,
  getParentTile,
  getPinsPerTileLimit,
  getPrefetchTiles,
  isPinInsideTile,
  tileKey,
} from "./tile-utils";
import type { ViewportBounds } from "./tile-utils";

type TileCache = Record<string, TileCacheEntry>;
type TileSummaryCache = Record<string, TileSummaryCacheEntry>;
type TileSnapshot = {
  key: string;
  entry: TileCacheEntry | undefined;
};
type TileSummarySnapshot = {
  key: string;
  entry: TileSummaryCacheEntry | undefined;
};
const TILE_CACHE_TTL_MS = 10 * 60 * 1000;
const MIN_PREFETCH_ZOOM = 13;
const MAX_PREFETCH_VISIBLE_TILES = 9;

const EMPTY_TILE_ENTRY: TileCacheEntry = {
  pins: [],
  status: "idle",
  fetchedAt: null,
};

const EMPTY_TILE_SUMMARY_ENTRY: TileSummaryCacheEntry = {
  summary: null,
  status: "idle",
  fetchedAt: null,
};

function getTileEntry(cache: TileCache, tile: TileCoordinates) {
  return cache[tileKey(tile)] ?? EMPTY_TILE_ENTRY;
}

function isTileEntryFresh(
  entry?: { status: "idle" | "loading" | "ready" | "error"; fetchedAt: number | null }
) {
  return (
    !!entry &&
    entry.status === "ready" &&
    entry.fetchedAt !== null &&
    Date.now() - entry.fetchedAt < TILE_CACHE_TTL_MS
  );
}

function mergePinsIntoTiles(
  cache: TileCache,
  tiles: TileCoordinates[],
  pins: Pin[]
) {
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

function collectAncestorPins(cache: TileCache, tile: TileCoordinates) {
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

function collectChildPins(cache: TileCache, tile: TileCoordinates) {
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

function comparePinsForRanking(a: Pin, b: Pin) {
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

function deriveParentTileEntryFromChildren(cache: TileCache, tile: TileCoordinates) {
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

  const rankedPins = Array.from(uniquePins.values())
    .sort(comparePinsForRanking)
    .slice(0, getPinsPerTileLimit(tile.z));

  return {
    pins: rankedPins,
    status: "ready" as const,
    fetchedAt: Date.now(),
  };
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
  const requestStatsRef = useRef({
    started: 0,
    completed: 0,
    aborted: 0,
  });

  const pins = useMemo(() => {
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
  }, [activeTiles, tileCache]);

  const tileSummaries = useMemo(() => {
    const visibleSummaries = new Map<string, TileSummary>();

    activeSummaryTiles.forEach((tile) => {
      const entry = summaryCache[tileKey(tile)] ?? EMPTY_TILE_SUMMARY_ENTRY;

      if (entry.status === "ready" && entry.summary) {
        visibleSummaries.set(tileKey(tile), entry.summary);
      }
    });

    return Array.from(visibleSummaries.values());
  }, [activeSummaryTiles, summaryCache]);

  const loadTiles = async (
    visibleTiles: TileCoordinates[],
    bounds?: ViewportBounds
  ) => {
    setActiveTiles(visibleTiles);

    const shouldPrefetch =
      !!bounds &&
      (visibleTiles[0]?.z ?? 0) >= MIN_PREFETCH_ZOOM &&
      visibleTiles.length <= MAX_PREFETCH_VISIBLE_TILES;

    const prefetchTiles =
      shouldPrefetch && bounds
        ? getPrefetchTiles(bounds, visibleTiles[0]?.z ?? 0)
        : [];
    const requestedTiles = [...visibleTiles, ...prefetchTiles].filter(
      (tile, index, allTiles) =>
        index === allTiles.findIndex((candidate) => tileKey(candidate) === tileKey(tile))
    );

    setTileCache((current) => {
      const nextCache = { ...current };

      requestedTiles.forEach((tile) => {
        const key = tileKey(tile);

        if (!nextCache[key] || nextCache[key].status === "idle" || nextCache[key].status === "error") {
          const derivedEntry = deriveParentTileEntryFromChildren(nextCache, tile);

          if (derivedEntry) {
            nextCache[key] = derivedEntry;
          }
        }
      });

      tileCacheRef.current = nextCache;
      return nextCache;
    });

    const missingTiles = requestedTiles.filter((tile) => {
      const key = tileKey(tile);
      const entry = tileCacheRef.current[key];

      return (!isTileEntryFresh(entry) || entry.status === "error") &&
        !inFlightTilesRef.current.has(key);
    });

    if (missingTiles.length === 0) {
      return;
    }

    if (activeRequestRef.current) {
      activeRequestRef.current.controller.abort();
      activeRequestRef.current.tileSnapshots.forEach(({ key }) => {
        inFlightTilesRef.current.delete(key);
      });
      activeRequestRef.current = null;
      requestStatsRef.current.aborted += 1;
      console.info("[pins] tile request aborted", {
        started: requestStatsRef.current.started,
        completed: requestStatsRef.current.completed,
        aborted: requestStatsRef.current.aborted,
      });
    }

    const controller = new AbortController();
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    const tileSnapshots = missingTiles.map((tile) => {
      const key = tileKey(tile);
      return {
        key,
        entry: tileCacheRef.current[key],
      };
    });
    activeRequestRef.current = {
      controller,
      requestId,
      tileSnapshots,
    };
    requestStatsRef.current.started += 1;
    console.info("[pins] tile request started", {
      requestId,
      tileCount: missingTiles.length,
      started: requestStatsRef.current.started,
      completed: requestStatsRef.current.completed,
      aborted: requestStatsRef.current.aborted,
    });

    setTileCache((current) => {
      const nextCache = { ...current };

      missingTiles.forEach((tile) => {
        const key = tileKey(tile);
        const existingEntry = nextCache[key];

        nextCache[key] = {
          pins: existingEntry?.pins ?? [],
          status: "loading",
          fetchedAt: existingEntry?.fetchedAt ?? null,
        };
      });

      tileCacheRef.current = nextCache;
      return nextCache;
    });

    missingTiles.forEach((tile) => inFlightTilesRef.current.add(tileKey(tile)));

    try {
      const response = await getPinsForTilesApi(missingTiles, controller.signal);
      if (!activeRequestRef.current || activeRequestRef.current.requestId !== requestId) {
        return;
      }
      const fetchedTiles = response.tiles ?? missingTiles;

      setTileCache((current) => {
        const nextCache = mergePinsIntoTiles(current, fetchedTiles, response.pins ?? []);
        tileCacheRef.current = nextCache;
        return nextCache;
      });
      requestStatsRef.current.completed += 1;
      console.info("[pins] tile request completed", {
        requestId,
        tileCount: fetchedTiles.length,
        pinCount: response.pins?.length ?? 0,
        started: requestStatsRef.current.started,
        completed: requestStatsRef.current.completed,
        aborted: requestStatsRef.current.aborted,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        setTileCache((current) => {
          const nextCache = { ...current };

          tileSnapshots.forEach(({ key, entry }) => {
            nextCache[key] = entry ?? EMPTY_TILE_ENTRY;
          });

          tileCacheRef.current = nextCache;
          return nextCache;
        });

        return;
      }

      setTileCache((current) => {
        const nextCache = { ...current };

        missingTiles.forEach((tile) => {
          const key = tileKey(tile);
          const existingEntry = nextCache[key];

          nextCache[key] = {
            pins: existingEntry?.pins ?? [],
            status: "error",
            fetchedAt: existingEntry?.fetchedAt ?? null,
          };
        });

        tileCacheRef.current = nextCache;
        return nextCache;
      });
    } finally {
      missingTiles.forEach((tile) => inFlightTilesRef.current.delete(tileKey(tile)));
      if (activeRequestRef.current?.requestId === requestId) {
        activeRequestRef.current = null;
      }
    }
  };

  const loadTileSummaries = async (tiles: TileCoordinates[]) => {
    setActiveSummaryTiles(tiles);

    if (tiles.length === 0) {
      return;
    }

    const missingTiles = tiles.filter((tile) => {
      const key = tileKey(tile);
      const entry = summaryCacheRef.current[key];

      return (!isTileEntryFresh(entry) || entry.status === "error") &&
        !inFlightSummaryTilesRef.current.has(key);
    });

    if (missingTiles.length === 0) {
      return;
    }

    if (activeSummaryRequestRef.current) {
      activeSummaryRequestRef.current.controller.abort();
      activeSummaryRequestRef.current.tileSnapshots.forEach(({ key }) => {
        inFlightSummaryTilesRef.current.delete(key);
      });
      activeSummaryRequestRef.current = null;
    }

    const controller = new AbortController();
    const requestId = summaryRequestIdRef.current + 1;
    summaryRequestIdRef.current = requestId;
    const tileSnapshots = missingTiles.map((tile) => {
      const key = tileKey(tile);
      return {
        key,
        entry: summaryCacheRef.current[key],
      };
    });

    activeSummaryRequestRef.current = {
      controller,
      requestId,
      tileSnapshots,
    };

    setSummaryCache((current) => {
      const nextCache = { ...current };

      missingTiles.forEach((tile) => {
        const key = tileKey(tile);
        const existingEntry = nextCache[key];

        nextCache[key] = {
          summary: existingEntry?.summary ?? null,
          status: "loading",
          fetchedAt: existingEntry?.fetchedAt ?? null,
        };
      });

      summaryCacheRef.current = nextCache;
      return nextCache;
    });

    missingTiles.forEach((tile) => inFlightSummaryTilesRef.current.add(tileKey(tile)));

    try {
      const response = await getPinSummariesForTilesApi(missingTiles, controller.signal);
      if (!activeSummaryRequestRef.current || activeSummaryRequestRef.current.requestId !== requestId) {
        return;
      }

      const summaryMap = new Map(
        (response.summaries ?? []).map((summary) => [tileKey(summary), summary])
      );
      const fetchedTiles = response.tiles ?? missingTiles;

      setSummaryCache((current) => {
        const nextCache = { ...current };

        fetchedTiles.forEach((tile) => {
          const key = tileKey(tile);

          nextCache[key] = {
            summary: summaryMap.get(key) ?? null,
            status: "ready",
            fetchedAt: Date.now(),
          };
        });

        summaryCacheRef.current = nextCache;
        return nextCache;
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        setSummaryCache((current) => {
          const nextCache = { ...current };

          tileSnapshots.forEach(({ key, entry }) => {
            nextCache[key] = entry ?? EMPTY_TILE_SUMMARY_ENTRY;
          });

          summaryCacheRef.current = nextCache;
          return nextCache;
        });

        return;
      }

      setSummaryCache((current) => {
        const nextCache = { ...current };

        missingTiles.forEach((tile) => {
          const key = tileKey(tile);
          const existingEntry = nextCache[key];

          nextCache[key] = {
            summary: existingEntry?.summary ?? null,
            status: "error",
            fetchedAt: existingEntry?.fetchedAt ?? null,
          };
        });

        summaryCacheRef.current = nextCache;
        return nextCache;
      });
    } finally {
      missingTiles.forEach((tile) => inFlightSummaryTilesRef.current.delete(tileKey(tile)));
      if (activeSummaryRequestRef.current?.requestId === requestId) {
        activeSummaryRequestRef.current = null;
      }
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

  return { pins, tileSummaries, addPin, editPin, removePin, loadTiles, loadTileSummaries };
}
