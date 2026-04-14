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

export const MIN_PIN_ZOOM = 7;

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

export function tileKey(tile: TileCoordinates) {
  return `${tile.z}/${tile.x}/${tile.y}`;
}

function getTilesForBounds(
  bounds: ViewportBounds,
  zoom: number,
  padding = 0
) {
  const clampedZoom = Math.max(0, Math.floor(zoom));
  const northWest = latLngToTile(bounds.north, bounds.west, clampedZoom);
  const southEast = latLngToTile(bounds.south, bounds.east, clampedZoom);

  const maxIndex = 2 ** clampedZoom - 1;
  const minX = Math.max(0, Math.min(northWest.x, southEast.x) - padding);
  const maxX = Math.min(maxIndex, Math.max(northWest.x, southEast.x) + padding);
  const minY = Math.max(0, Math.min(northWest.y, southEast.y) - padding);
  const maxY = Math.min(maxIndex, Math.max(northWest.y, southEast.y) + padding);

  const tiles: TileCoordinates[] = [];

  for (let x = minX; x <= maxX; x += 1) {
    for (let y = minY; y <= maxY; y += 1) {
      tiles.push({ x, y, z: clampedZoom });
    }
  }

  return tiles;
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
  if (zoom < MIN_PIN_ZOOM) {
    return [];
  }

  return getTilesForBounds(bounds, zoom);
}

export function getPrefetchTiles(bounds: ViewportBounds, zoom: number) {
  if (zoom < MIN_PIN_ZOOM) {
    return [];
  }

  const visibleTiles = getTilesForBounds(bounds, zoom);
  const visibleKeys = new Set(visibleTiles.map(tileKey));

  return getTilesForBounds(bounds, zoom, 1).filter(
    (tile) => !visibleKeys.has(tileKey(tile))
  );
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

export function getParentTile(tile: TileCoordinates) {
  if (tile.z <= 0) {
    return null;
  }

  return {
    x: Math.floor(tile.x / 2),
    y: Math.floor(tile.y / 2),
    z: tile.z - 1,
  };
}

export function getChildTiles(tile: TileCoordinates) {
  const nextZoom = tile.z + 1;
  const baseX = tile.x * 2;
  const baseY = tile.y * 2;

  return [
    { x: baseX, y: baseY, z: nextZoom },
    { x: baseX + 1, y: baseY, z: nextZoom },
    { x: baseX, y: baseY + 1, z: nextZoom },
    { x: baseX + 1, y: baseY + 1, z: nextZoom },
  ];
}
