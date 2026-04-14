import { useMemo, useRef, useState } from "react";
import { createPinApi, deletePinApi, getPinsForTilesApi, updatePinApi } from "./api";
import { CreatePinInput, Pin, TileCoordinates, UpdatePinInput } from "./types";
import { isPinInsideTile, tileKey } from "./tile-utils";

type TileCache = Record<string, Pin[]>;

export function usePins() {
  const [tileCache, setTileCache] = useState<TileCache>({});
  const [activeTileKeys, setActiveTileKeys] = useState<string[]>([]);
  const inFlightTilesRef = useRef<Set<string>>(new Set());

  const pins = useMemo(() => {
    const pinMap = new Map<string, Pin>();

    activeTileKeys.forEach((key) => {
      const cachedPins = tileCache[key] ?? [];
      cachedPins.forEach((pin) => {
        pinMap.set(pin.id, pin);
      });
    });

    const renderedPins = Array.from(pinMap.values());
    console.log("[pins] rendered pins summary", {
      activeTileCount: activeTileKeys.length,
      renderedPinCount: renderedPins.length,
      cachedTileCount: Object.keys(tileCache).length,
    });

    return renderedPins;
  }, [activeTileKeys, tileCache]);

  const loadTiles = async (tiles: TileCoordinates[]) => {
    const nextActiveTileKeys = tiles.map(tileKey);
    console.log("[pins] visible tiles", {
      count: nextActiveTileKeys.length,
      keys: nextActiveTileKeys,
    });
    setActiveTileKeys(nextActiveTileKeys);

    const missingTiles = tiles.filter((tile) => {
      const key = tileKey(tile);
      return !tileCache[key] && !inFlightTilesRef.current.has(key);
    });
    const cachedVisibleTiles = nextActiveTileKeys.filter((key) => Boolean(tileCache[key]));
    const inFlightVisibleTiles = nextActiveTileKeys.filter((key) =>
      inFlightTilesRef.current.has(key)
    );

    console.log("[pins] tile coverage", {
      visibleTileCount: nextActiveTileKeys.length,
      cachedVisibleTileCount: cachedVisibleTiles.length,
      missingTileCount: missingTiles.length,
      inFlightVisibleTileCount: inFlightVisibleTiles.length,
    });

    if (cachedVisibleTiles.length > 0) {
      console.log("[pins] visible cached tiles", cachedVisibleTiles);
    }

    if (missingTiles.length === 0) {
      console.log("[pins] all visible tiles served from cache");
      return;
    }

    console.log(
      "[pins] requesting missing tiles",
      missingTiles.map((tile) => tileKey(tile))
    );

    missingTiles.forEach((tile) => {
      inFlightTilesRef.current.add(tileKey(tile));
    });

    try {
      const response = await getPinsForTilesApi(missingTiles);
      const requestedTiles = response.tiles ?? missingTiles;
      const pinCountsByTile = requestedTiles.reduce<Record<string, number>>(
        (accumulator, tile) => {
          const key = tileKey(tile);
          accumulator[key] = (response.pins ?? []).filter((pin) =>
            isPinInsideTile(pin, tile)
          ).length;
          return accumulator;
        },
        {}
      );

      console.log("[pins] tile response", {
        requestedTiles: requestedTiles.map((tile) => tileKey(tile)),
        pinCount: response.pins?.length ?? 0,
        pinCountsByTile,
      });

      setTileCache((current) => {
        const nextCache = { ...current };

        requestedTiles.forEach((tile) => {
          const key = tileKey(tile);
          nextCache[key] = (response.pins ?? []).filter((pin) =>
            isPinInsideTile(pin, tile)
          );
        });

        return nextCache;
      });
    } finally {
      missingTiles.forEach((tile) => {
        inFlightTilesRef.current.delete(tileKey(tile));
      });
      console.log("[pins] in-flight tile requests cleared", {
        remainingInFlightTileCount: inFlightTilesRef.current.size,
      });
    }
  };

  const syncPinIntoCache = (pin: Pin) => {
    setTileCache((current) => {
      const nextCache: TileCache = {};

      Object.entries(current).forEach(([key, pinsForTile]) => {
        const [z, x, y] = key.split("/").map(Number);
        const tile = { z, x, y };
        const nextPins = pinsForTile.filter((existingPin) => existingPin.id !== pin.id);

        nextCache[key] = isPinInsideTile(pin, tile) ? [...nextPins, pin] : nextPins;
      });

      return nextCache;
    });
  };

  const removePinFromCache = (pinId: string) => {
    setTileCache((current) => {
      const nextCache: TileCache = {};

      Object.entries(current).forEach(([key, pinsForTile]) => {
        nextCache[key] = pinsForTile.filter((pin) => pin.id !== pinId);
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
