import { describe, expect, it } from 'vitest';
import {
  getPinsPerTileLimit,
  getViewportPinLimit,
  tileToBounds,
} from '../../../src/modules/pins/pins.helpers';

describe('pins.helpers', () => {
  it('normalizes negative zoom levels for per-tile limits', () => {
    expect(getPinsPerTileLimit(-5)).toBe(1);
  });

  it('returns the expected pin limit at zoom breakpoints', () => {
    expect(getPinsPerTileLimit(8)).toBe(2);
    expect(getPinsPerTileLimit(14)).toBe(10);
    expect(getPinsPerTileLimit(17)).toBe(20);
  });

  it('returns the expected viewport limit at zoom breakpoints', () => {
    expect(getViewportPinLimit(4)).toBe(4);
    expect(getViewportPinLimit(12)).toBe(36);
    expect(getViewportPinLimit(20)).toBe(140);
  });

  it('converts slippy-map tiles into geographic bounds', () => {
    const bounds = tileToBounds({ x: 0, y: 0, z: 0 });

    expect(bounds.west).toBe(-180);
    expect(bounds.east).toBe(180);
    expect(bounds.north).toBeCloseTo(85.0511, 3);
    expect(bounds.south).toBeCloseTo(-85.0511, 3);
  });
});
