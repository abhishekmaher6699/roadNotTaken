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

export function getPinsPerTileLimit(zoom: number) {
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

export function getViewportPinLimit(zoom: number) {
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

export function tileToBounds({ x, y, z }: TileCoordinates): TileBounds {
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
