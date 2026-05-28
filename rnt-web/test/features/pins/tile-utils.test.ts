import { describe, expect, it } from "vitest";
import {
  MIN_PIN_ZOOM,
  getChildTiles,
  getParentTile,
  getPinsPerTileLimit,
  getPrefetchTiles,
  getTileBounds,
  getVisibleMapTiles,
  getVisibleSummaryTiles,
  getVisibleTiles,
  isPinInsideTile,
  latLngToTile,
  tileKey,
} from "../../../features/pins/tiles/tile-utils";

describe("tile-utils", () => {
  it("returns the expected pin limit at zoom breakpoints", () => {
    expect(getPinsPerTileLimit(3)).toBe(1);
    expect(getPinsPerTileLimit(12)).toBe(6);
    expect(getPinsPerTileLimit(17)).toBe(20);
  });

  it("formats tile keys consistently", () => {
    expect(tileKey({ x: 5, y: 10, z: 2 })).toBe("2/5/10");
  });

  it("calculates the correct Mercator tile for a known coordinate", () => {
    expect(latLngToTile(0, 0, 2)).toEqual({ x: 2, y: 2, z: 2 });
  });

  it("returns all visible map tiles for a viewport", () => {
    const tiles = getVisibleMapTiles(
      { north: 10, south: -10, east: 10, west: -10 },
      2
    );

    expect(tiles).toEqual(
      expect.arrayContaining([
        { x: 1, y: 1, z: 2 },
        { x: 1, y: 2, z: 2 },
        { x: 2, y: 1, z: 2 },
        { x: 2, y: 2, z: 2 },
      ])
    );
  });

  it("returns no raw visible tiles below the minimum pin zoom", () => {
    const tiles = getVisibleTiles(
      { north: 10, south: -10, east: 10, west: -10 },
      MIN_PIN_ZOOM - 1
    );

    expect(tiles).toEqual([]);
  });

  it("returns visible raw tiles at and above the minimum pin zoom", () => {
    const tiles = getVisibleTiles(
      { north: 10, south: -10, east: 10, west: -10 },
      MIN_PIN_ZOOM
    );

    expect(tiles.length).toBeGreaterThan(0);
    expect(tiles.every((tile) => tile.z === MIN_PIN_ZOOM)).toBe(true);
  });

  it("uses slightly finer tiles for summary markers below the raw pin zoom", () => {
    const tiles = getVisibleSummaryTiles(
      { north: 22, south: 17, east: 78, west: 72 },
      MIN_PIN_ZOOM - 1
    );

    expect(tiles.length).toBeGreaterThan(0);
    expect(tiles.every((tile) => tile.z === MIN_PIN_ZOOM)).toBe(true);
  });

  it("caps summary tiles at the raw pin zoom", () => {
    const tiles = getVisibleSummaryTiles(
      { north: 10, south: -10, east: 10, west: -10 },
      MIN_PIN_ZOOM
    );

    expect(tiles.length).toBeGreaterThan(0);
    expect(tiles.every((tile) => tile.z === MIN_PIN_ZOOM)).toBe(true);
  });

  it("returns only the border ring for prefetch tiles", () => {
    const bounds = { north: 10, south: -10, east: 10, west: -10 };
    const visible = new Set(getVisibleTiles(bounds, MIN_PIN_ZOOM).map(tileKey));
    const prefetch = getPrefetchTiles(bounds, MIN_PIN_ZOOM);

    expect(prefetch.length).toBeGreaterThan(0);
    expect(prefetch.every((tile) => !visible.has(tileKey(tile)))).toBe(true);
  });

  it("returns null for the parent of a zoom-0 tile", () => {
    expect(getParentTile({ x: 0, y: 0, z: 0 })).toBeNull();
  });

  it("returns the correct direct parent tile", () => {
    expect(getParentTile({ x: 5, y: 7, z: 4 })).toEqual({ x: 2, y: 3, z: 3 });
  });

  it("returns exactly four child tiles for a parent", () => {
    expect(getChildTiles({ x: 2, y: 3, z: 3 })).toEqual([
      { x: 4, y: 6, z: 4 },
      { x: 5, y: 6, z: 4 },
      { x: 4, y: 7, z: 4 },
      { x: 5, y: 7, z: 4 },
    ]);
  });

  it("returns tile bounds and recognizes whether a pin falls inside them", () => {
    const tile = { x: 2, y: 2, z: 2 };
    const bounds = getTileBounds(tile);

    expect(bounds.west).toBeLessThan(bounds.east);
    expect(bounds.south).toBeLessThan(bounds.north);
    expect(isPinInsideTile({ latitude: -40, longitude: 45 }, tile)).toBe(true);
    expect(isPinInsideTile({ latitude: 80, longitude: 150 }, tile)).toBe(false);
  });
});
