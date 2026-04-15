import { TileQueryInput } from './pins.types';
import { getPinsPerTileLimit, tileToBounds } from './pins.helpers';

export type RankedRequestedTile = TileQueryInput['tiles'][number] & {
  west: number;
  east: number;
  south: number;
  north: number;
  pinLimit: number;
};

export type SummaryRequestedTile = TileQueryInput['tiles'][number] & {
  west: number;
  east: number;
  south: number;
  north: number;
};

// Converting z/x/y tiles into real bounds once keeps the SQL side much easier to read.
export function buildRankedRequestedTiles(tiles: TileQueryInput['tiles']): RankedRequestedTile[] {
  // How:
  // - Loop over the incoming request tiles.
  // - Convert each z/x/y tile into west/east/south/north bounds.
  // - Attach the per-tile pin cap for that tile's zoom level.
  return tiles.map((tile) => {
    const bounds = tileToBounds(tile);

    return {
      ...tile,
      ...bounds,
      pinLimit: getPinsPerTileLimit(tile.z),
    };
  });
}

export function buildSummaryRequestedTiles(tiles: TileQueryInput['tiles']): SummaryRequestedTile[] {
  // How:
  // - Same shape as ranked tiles, but summary tiles do not need a per-tile pin limit.
  return tiles.map((tile) => {
    const bounds = tileToBounds(tile);

    return {
      ...tile,
      ...bounds,
    };
  });
}

export function buildRankedTileValuesSql(tiles: RankedRequestedTile[]) {
  // How:
  // - Convert the prepared tile objects into SQL VALUES tuples.
  // - This lets Postgres treat the incoming tiles as an inline temporary table.
  return tiles
    .map(
      (tile) =>
        `(${tile.x}, ${tile.y}, ${tile.z}, ${tile.west}, ${tile.east}, ${tile.south}, ${tile.north}, ${tile.pinLimit})`
    )
    .join(', ');
}

export function buildSummaryTileValuesSql(tiles: SummaryRequestedTile[]) {
  // How:
  // - Same inline-table trick as ranked tiles, just without the pin_limit column.
  return tiles
    .map(
      (tile) =>
        `(${tile.x}, ${tile.y}, ${tile.z}, ${tile.west}, ${tile.east}, ${tile.south}, ${tile.north})`
    )
    .join(', ');
}
