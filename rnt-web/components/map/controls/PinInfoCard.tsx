"use client";

import type { PinInfoCardProps } from "./types";

export function PinInfoCard({ pin, mode }: PinInfoCardProps) {
  if (!pin) {
    return (
      <div className="rounded-3xl bg-white/95 p-5 shadow-xl ring-1 ring-black/10 backdrop-blur">
        <p className="text-sm font-semibold text-neutral-900">
          {mode === "view" ? "Pin details" : "Edit mode"}
        </p>
        <p className="mt-2 text-sm text-neutral-600">
          {mode === "view"
            ? "Select a pin to view its details here."
            : "Click on the map to choose a location for a new pin."}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white/95 p-5 shadow-xl ring-1 ring-black/10 backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
        Selected Pin
      </p>
      <h2 className="mt-2 text-lg font-semibold text-neutral-950">{pin.title}</h2>
      <p className="mt-3 text-sm text-neutral-600">
        Latitude {pin.latitude.toFixed(5)}
      </p>
      <p className="text-sm text-neutral-600">
        Longitude {pin.longitude.toFixed(5)}
      </p>
      {pin.description && (
        <p className="mt-3 text-sm leading-6 text-neutral-700">
          {pin.description}
        </p>
      )}
    </div>
  );
}
