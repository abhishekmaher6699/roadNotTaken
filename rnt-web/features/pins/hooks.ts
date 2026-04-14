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

    return Array.from(pinMap.values());
  }, [activeTileKeys, tileCache]);

  const loadTiles = async (tiles: TileCoordinates[]) => {
    const nextActiveTileKeys = tiles.map(tileKey);
    setActiveTileKeys(nextActiveTileKeys);

    const missingTiles = tiles.filter((tile) => {
      const key = tileKey(tile);
      return !tileCache[key] && !inFlightTilesRef.current.has(key);
    });

    if (missingTiles.length === 0) {
      return;
    }

    missingTiles.forEach((tile) => {
      inFlightTilesRef.current.add(tileKey(tile));
    });

    try {
      const response = await getPinsForTilesApi(missingTiles);
      const requestedTiles = response.tiles ?? missingTiles;

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
