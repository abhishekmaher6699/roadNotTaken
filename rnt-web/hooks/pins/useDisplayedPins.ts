import { useMemo } from "react";
import type { Pin } from "@/features/pins/types";
import type { MapViewport } from "@/types/mapTypes";

/**
 * When a search results panel is open, returns only the results that are
 * currently visible in the viewport. Otherwise returns the normal pin list.
 */
export function useDisplayedPins(
  pins: Pin[],
  searchResults: Pin[],
  isResultsPanelOpen: boolean,
  viewport: MapViewport | null
): Pin[] {
  return useMemo(() => {
    if (!isResultsPanelOpen) return pins;
    if (!viewport) return searchResults;

    return searchResults.filter(
      (p) =>
        p.latitude >= viewport.south &&
        p.latitude <= viewport.north &&
        p.longitude >= viewport.west &&
        p.longitude <= viewport.east
    );
  }, [pins, searchResults, isResultsPanelOpen, viewport]);
}
