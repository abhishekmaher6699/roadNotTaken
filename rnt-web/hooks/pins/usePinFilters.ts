import { useCallback, useMemo, useState } from "react";
import type { Pin } from "@/features/pins/types";

export interface PinFilters {
  categories: string[];
  statuses: string[];
  accessLevels: string[];
}

const EMPTY_FILTERS: PinFilters = {
  categories: [],
  statuses: [],
  accessLevels: [],
};

function toggle(arr: string[], value: string): string[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

export function usePinFilters() {
  const [filters, setFilters] = useState<PinFilters>(EMPTY_FILTERS);

  const activeFilterCount = useMemo(
    () =>
      filters.categories.length +
      filters.statuses.length +
      filters.accessLevels.length,
    [filters]
  );

  const isFiltersActive = activeFilterCount > 0;

  const clearFilters = useCallback(() => setFilters(EMPTY_FILTERS), []);

  const toggleCategory = useCallback(
    (value: string) =>
      setFilters((f) => ({ ...f, categories: toggle(f.categories, value) })),
    []
  );

  const toggleStatus = useCallback(
    (value: string) =>
      setFilters((f) => ({ ...f, statuses: toggle(f.statuses, value) })),
    []
  );

  const toggleAccessLevel = useCallback(
    (value: string) =>
      setFilters((f) => ({ ...f, accessLevels: toggle(f.accessLevels, value) })),
    []
  );

  /**
   * Applies active filters to a pin list.
   * Within each group: OR logic (pin matches any selected value).
   * Across groups: AND logic (pin must satisfy every active group).
   * When no filters are active the original list is returned untouched.
   */
  const applyFilters = useCallback(
    (pins: Pin[]): Pin[] => {
      if (!isFiltersActive) return pins;

      return pins.filter((pin) => {
        if (
          filters.categories.length > 0 &&
          !filters.categories.includes(pin.category ?? "general")
        ) {
          return false;
        }
        if (
          filters.statuses.length > 0 &&
          !filters.statuses.includes(pin.status ?? "unknown")
        ) {
          return false;
        }
        if (
          filters.accessLevels.length > 0 &&
          !filters.accessLevels.includes(pin.access_level ?? "unknown")
        ) {
          return false;
        }
        return true;
      });
    },
    [filters, isFiltersActive]
  );

  return {
    filters,
    activeFilterCount,
    isFiltersActive,
    applyFilters,
    clearFilters,
    toggleCategory,
    toggleStatus,
    toggleAccessLevel,
  };
}
