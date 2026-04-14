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
  if (zoomLevel <= 6) return 2;
  if (zoomLevel <= 8) return 3;
  if (zoomLevel <= 10) return 5;
  if (zoomLevel === 11) return 7;
  if (zoomLevel === 12) return 10;
  if (zoomLevel === 13) return 14;
  if (zoomLevel === 14) return 18;
  if (zoomLevel === 15) return 24;
  if (zoomLevel === 16) return 32;

  return 40;
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
