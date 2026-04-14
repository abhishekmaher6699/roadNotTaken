export interface TileCoordinates {
  x: number;
  y: number;
  z: number;
}

export interface ViewportBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export function tileKey(tile: TileCoordinates) {
  return `${tile.z}/${tile.x}/${tile.y}`;
}

export function latLngToTile(lat: number, lng: number, zoom: number): TileCoordinates {
  const normalizedLng = ((lng + 180) / 360) * 2 ** zoom;
  const latRad = (lat * Math.PI) / 180;
  const normalizedLat =
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
    2 ** zoom;

  return {
    x: Math.floor(normalizedLng),
    y: Math.floor(normalizedLat),
    z: zoom,
  };
}

export function getVisibleTiles(bounds: ViewportBounds, zoom: number) {
  const clampedZoom = Math.max(0, Math.floor(zoom));
  const northWest = latLngToTile(bounds.north, bounds.west, clampedZoom);
  const southEast = latLngToTile(bounds.south, bounds.east, clampedZoom);

  const maxIndex = 2 ** clampedZoom - 1;
  const tiles: TileCoordinates[] = [];

  for (
    let x = Math.max(0, Math.min(northWest.x, southEast.x));
    x <= Math.min(maxIndex, Math.max(northWest.x, southEast.x));
    x += 1
  ) {
    for (
      let y = Math.max(0, Math.min(northWest.y, southEast.y));
      y <= Math.min(maxIndex, Math.max(northWest.y, southEast.y));
      y += 1
    ) {
      tiles.push({ x, y, z: clampedZoom });
    }
  }

  return tiles;
}

export function getTileBounds(tile: TileCoordinates): ViewportBounds {
  const n = 2 ** tile.z;
  const west = (tile.x / n) * 360 - 180;
  const east = ((tile.x + 1) / n) * 360 - 180;

  const northLatRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * tile.y) / n)));
  const southLatRad = Math.atan(
    Math.sinh(Math.PI * (1 - (2 * (tile.y + 1)) / n))
  );

  return {
    west,
    east,
    north: (northLatRad * 180) / Math.PI,
    south: (southLatRad * 180) / Math.PI,
  };
}

export function isPinInsideTile(
  pin: { latitude: number; longitude: number },
  tile: TileCoordinates
) {
  const bounds = getTileBounds(tile);

  return (
    pin.longitude >= bounds.west &&
    pin.longitude < bounds.east &&
    pin.latitude >= bounds.south &&
    pin.latitude < bounds.north
  );
}
