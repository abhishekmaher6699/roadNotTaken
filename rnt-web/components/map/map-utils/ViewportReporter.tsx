"use client";

import { useEffect } from "react";
import { useMap, useMapEvents } from "react-leaflet";
import type { MapViewProps } from "@/types/mapTypes";

interface ViewportReporterProps {
  onViewportChange: MapViewProps["onViewportChange"];
}

/** Reports the current map viewport on move/zoom and on first mount. */
export function ViewportReporter({ onViewportChange }: ViewportReporterProps) {
  const map = useMap();

  const report = () => {
    const bounds = map.getBounds();
    onViewportChange({
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest(),
      zoom: map.getZoom(),
    });
  };

  useMapEvents({
    moveend: report,
    zoomend: report,
  });

  // Report immediately on mount so tile loading begins without waiting for a move.
  useEffect(() => {
    report();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
