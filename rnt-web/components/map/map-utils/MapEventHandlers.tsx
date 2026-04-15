"use client";

import { useMapEvents } from "react-leaflet";
import type { AddPinProps } from "@/types/mapTypes";

/** Registers a map click handler that fires when the user places a new pin. */
export function AddPin({ onAdd }: AddPinProps) {
  useMapEvents({
    click(event) {
      onAdd(event.latlng);
    },
  });

  return null;
}

interface ClearSelectedPinProps {
  enabled: boolean;
  onClear: () => void;
}

/** Clears the selected pin when the user clicks the map in view mode. */
export function ClearSelectedPin({ enabled, onClear }: ClearSelectedPinProps) {
  useMapEvents({
    click() {
      if (enabled) onClear();
    },
  });

  return null;
}
