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

// Below this zoom we switch to aggregated discovery markers instead of raw pins.
export const MIN_PIN_ZOOM = 7;

export function getPinsPerTileLimit(zoom: number) {
  // This mirrors the backend limit ladder so locally derived parent tiles behave the same way.
  // How:
  // - Normalize the incoming zoom to an integer.
  // - Walk down the zoom ladder and return the cap for that band.
  // - Lower zooms return smaller caps, higher zooms return larger caps.
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

// This is the shared slippy-map tile calculation used by both raw pin and summary requests.
export function getVisibleMapTiles(
  bounds: ViewportBounds,
  zoom: number,
  padding = 0
) {
  // Slippy-map grids only exist at integer zoom levels, so we normalize here once.
  // How:
  // - Convert the viewport's northwest and southeast corners into tile coordinates.
  // - Expand outward by `padding` tiles when prefetching is needed.
  // - Loop through the x/y rectangle between those corners.
  // - Return every z/x/y tile in that rectangle.
  const clampedZoom = Math.max(0, Math.floor(zoom));
  const northWest = latLngToTile(bounds.north, bounds.west, clampedZoom);
  const southEast = latLngToTile(bounds.south, bounds.east, clampedZoom);

  // Padding is how we ask for one extra border ring around the viewport when prefetching.
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
  // Standard Web Mercator lat/lng -> z/x/y conversion.
  // How:
  // - Normalize longitude from [-180, 180] into the tile grid width.
  // - Project latitude with the Mercator formula.
  // - Multiply by 2^zoom to move into the target tile grid.
  // - Floor x/y so we land on the containing tile.
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

  // Once we are above the discovery threshold, renderable content comes from raw pin tiles.
  return getVisibleMapTiles(bounds, zoom);
}

export function getPrefetchTiles(bounds: ViewportBounds, zoom: number) {
  if (zoom < MIN_PIN_ZOOM) {
    return [];
  }

  const visibleTiles = getVisibleMapTiles(bounds, zoom);
  const visibleKeys = new Set(visibleTiles.map(tileKey));

  // Prefetch is just the one-tile border outside the visible viewport.
  return getVisibleMapTiles(bounds, zoom, 1).filter(
    (tile) => !visibleKeys.has(tileKey(tile))
  );
}

export function getTileBounds(tile: TileCoordinates): ViewportBounds {
  // Inverse of latLngToTile: translate one z/x/y tile back into its geographic rectangle.
  // How:
  // - Convert tile x back into west/east longitudes.
  // - Convert tile y and y+1 back into north/south Mercator latitudes.
  // - Return the geographic box for that tile.
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
  // Tile membership is reused everywhere: response splitting, cache patching, and fallbacks.
  // How:
  // - Get the tile's geographic bounds.
  // - Check whether the pin coordinates fall inside that rectangle.
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

  // Parent tiles are how we reuse lower-detail results during zoom-out.
  // How:
  // - Move one zoom level up.
  // - Halve x and y with floor division, because one parent covers a 2x2 block of children.
  return {
    x: Math.floor(tile.x / 2),
    y: Math.floor(tile.y / 2),
    z: tile.z - 1,
  };
}

// One parent tile always expands into exactly four child tiles at the next zoom.
export function getChildTiles(tile: TileCoordinates) {
  const nextZoom = tile.z + 1;
  const baseX = tile.x * 2;
  const baseY = tile.y * 2;

  // How:
  // - Move one zoom level down.
  // - Expand one parent tile into its four child positions in that finer grid.
  return [
    { x: baseX, y: baseY, z: nextZoom },
    { x: baseX + 1, y: baseY, z: nextZoom },
    { x: baseX, y: baseY + 1, z: nextZoom },
    { x: baseX + 1, y: baseY + 1, z: nextZoom },
  ];
}
