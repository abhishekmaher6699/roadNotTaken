import { describe, expect, it } from 'vitest';
import {
  buildRankedRequestedTiles,
  buildRankedTileValuesSql,
  buildSummaryRequestedTiles,
  buildSummaryTileValuesSql,
} from '../../../src/modules/pins/pins.tile-queries';

describe('pins.tile-queries', () => {
  it('builds ranked requested tiles with geographic bounds and pin limits', () => {
    const [tile] = buildRankedRequestedTiles([{ x: 1, y: 2, z: 3 }]);

    expect(tile).toMatchObject({
      x: 1,
      y: 2,
      z: 3,
      pinLimit: 1,
    });
    expect(tile.west).toBeTypeOf('number');
    expect(tile.north).toBeTypeOf('number');
  });

  it('builds summary requested tiles without per-tile limits', () => {
    const [tile] = buildSummaryRequestedTiles([{ x: 1, y: 2, z: 3 }]);

    expect(tile).toMatchObject({
      x: 1,
      y: 2,
      z: 3,
    });
    expect('pinLimit' in tile).toBe(false);
  });

  it('serializes ranked tiles into an inline sql VALUES list', () => {
    const sql = buildRankedTileValuesSql([
      {
        x: 1,
        y: 2,
        z: 3,
        west: -90,
        east: -45,
        south: 0,
        north: 40,
        pinLimit: 2,
      },
    ]);

    expect(sql).toBe('(1, 2, 3, -90, -45, 0, 40, 2)');
  });

  it('serializes summary tiles into an inline sql VALUES list', () => {
    const sql = buildSummaryTileValuesSql([
      {
        x: 1,
        y: 2,
        z: 3,
        west: -90,
        east: -45,
        south: 0,
        north: 40,
      },
    ]);

    expect(sql).toBe('(1, 2, 3, -90, -45, 0, 40)');
  });
});
