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
