"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";

interface FlyToControllerProps {
  target: { lat: number; lng: number } | null;
}

/** Imperatively flies the Leaflet map to a new target whenever it changes. */
export function FlyToController({ target }: FlyToControllerProps) {
  const map = useMap();
  // Track the previous target so we only fly when the value genuinely changes.
  const prevTarget = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!target) return;
    if (
      prevTarget.current?.lat === target.lat &&
      prevTarget.current?.lng === target.lng
    ) {
      return;
    }
    prevTarget.current = target;
    map.flyTo([target.lat, target.lng], Math.max(map.getZoom(), 15), {
      duration: 1.2,
    });
  }, [target, map]);

  return null;
}
