import { useMemo, useRef, useState } from "react";
import {
  createPinApi,
  deletePinApi,
  getPinsForTilesApi,
  updatePinApi,
} from "./api";
import type {
  CreatePinInput,
  Pin,
  TileCacheEntry,
  TileCoordinates,
  UpdatePinInput,
} from "./types";
import {
  getChildTiles,
  getParentTile,
  getPrefetchTiles,
  isPinInsideTile,
  tileKey,
} from "./tile-utils";
import type { ViewportBounds } from "./tile-utils";

type TileCache = Record<string, TileCacheEntry>;

const EMPTY_TILE_ENTRY: TileCacheEntry = {
  pins: [],
  status: "idle",
  fetchedAt: null,
};

function getTileEntry(cache: TileCache, tile: TileCoordinates) {
  return cache[tileKey(tile)] ?? EMPTY_TILE_ENTRY;
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

export function usePins() {
  const [tileCache, setTileCache] = useState<TileCache>({});
  const [activeTiles, setActiveTiles] = useState<TileCoordinates[]>([]);
  const inFlightTilesRef = useRef<Set<string>>(new Set());

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

  const loadTiles = async (
    visibleTiles: TileCoordinates[],
    bounds?: ViewportBounds
  ) => {
    setActiveTiles(visibleTiles);

    const prefetchTiles = bounds ? getPrefetchTiles(bounds, visibleTiles[0]?.z ?? 0) : [];
    const requestedTiles = [...visibleTiles, ...prefetchTiles].filter(
      (tile, index, allTiles) =>
        index === allTiles.findIndex((candidate) => tileKey(candidate) === tileKey(tile))
    );

    const missingTiles = requestedTiles.filter((tile) => {
      const key = tileKey(tile);
      const entry = tileCache[key];

      return (!entry || entry.status === "idle" || entry.status === "error") &&
        !inFlightTilesRef.current.has(key);
    });

    if (missingTiles.length === 0) {
      return;
    }

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

      return nextCache;
    });

    missingTiles.forEach((tile) => inFlightTilesRef.current.add(tileKey(tile)));

    try {
      const response = await getPinsForTilesApi(missingTiles);
      const fetchedTiles = response.tiles ?? missingTiles;

      setTileCache((current) => mergePinsIntoTiles(current, fetchedTiles, response.pins ?? []));
    } catch {
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

        return nextCache;
      });
    } finally {
      missingTiles.forEach((tile) => inFlightTilesRef.current.delete(tileKey(tile)));
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

  return { pins, addPin, editPin, removePin, loadTiles };
}
