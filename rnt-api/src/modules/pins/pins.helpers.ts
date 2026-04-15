export interface TileCoordinates {
  x: number;
  y: number;
  z: number;
}

export interface TileBounds {
  west: number;
  south: number;
  east: number;
  north: number;
}

// These caps control how many ranked pins we allow inside one tile at a given zoom.
export function getPinsPerTileLimit(zoom: number) {
  // How:
  // - Normalize the incoming zoom to an integer.
  // - Match that zoom against the cap ladder.
  // - Return the max number of pins one tile may contribute at that zoom.
  const zoomLevel = Math.max(0, Math.floor(zoom));

  if (zoomLevel <= 4) return 1;
  if (zoomLevel <= 6) return 1;
  if (zoomLevel <= 8) return 2;
  if (zoomLevel <= 10) return 3;
  if (zoomLevel === 11) return 4;
  if (zoomLevel === 12) return 6;
  if (zoomLevel === 13) return 8;
  if (zoomLevel === 14) return 10;
  if (zoomLevel === 15) return 12;
  if (zoomLevel === 16) return 16;

  return 20;
}

// A second viewport cap stops many visible tiles from flooding the whole screen at once.
export function getViewportPinLimit(zoom: number) {
  // How:
  // - Use the highest zoom from the current request batch.
  // - Match it against the viewport-wide cap ladder.
  // - Apply that number later as the final SQL LIMIT after per-tile ranking.
  const zoomLevel = Math.max(0, Math.floor(zoom));

  if (zoomLevel <= 4) return 4;
  if (zoomLevel <= 6) return 6;
  if (zoomLevel <= 8) return 10;
  if (zoomLevel <= 10) return 16;
  if (zoomLevel === 11) return 24;
  if (zoomLevel === 12) return 36;
  if (zoomLevel === 13) return 48;
  if (zoomLevel === 14) return 64;
  if (zoomLevel === 15) return 84;
  if (zoomLevel === 16) return 110;

  return 140;
}

// Backend tile queries use the same slippy-map z/x/y math as the frontend.
export function tileToBounds({ x, y, z }: TileCoordinates): TileBounds {
  // How:
  // - Convert tile x into west/east longitude edges.
  // - Convert tile y and y+1 into north/south Mercator latitude edges.
  // - Return the geographic rectangle Postgres will use for point-in-box matching.
  const n = 2 ** z;
  const west = (x / n) * 360 - 180;
  const east = ((x + 1) / n) * 360 - 180;

  const northLatRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n)));
  const southLatRad = Math.atan(
    Math.sinh(Math.PI * (1 - (2 * (y + 1)) / n))
  );

  return {
    west,
    south: (southLatRad * 180) / Math.PI,
    east,
    north: (northLatRad * 180) / Math.PI,
  };
}
