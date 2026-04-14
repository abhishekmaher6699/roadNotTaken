"use client";

import type { PinInfoCardProps } from "./types";
import { getOptimizedCloudinaryUrl } from "@/lib/cloudinary";

export function PinInfoCard({
  pin,
  mode,
  onViewDetails,
}: PinInfoCardProps) {
  const previewImageUrl = getOptimizedCloudinaryUrl(pin?.thumbnail_url, "card");

  if (!pin) {
    return (
      <div className="rounded-3xl bg-white/95 p-4 shadow-xl ring-1 ring-black/10 backdrop-blur sm:p-5">
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
    <div className="overflow-hidden rounded-3xl bg-white/95 shadow-xl ring-1 ring-black/10 backdrop-blur">
      {previewImageUrl && (
        <img
          src={previewImageUrl}
          alt={pin.title}
          className="h-32 w-full object-cover sm:h-40"
        />
      )}

      <div className="p-4 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
          Selected Pin
        </p>

        <h2 className="mt-2 text-base font-semibold text-neutral-950 sm:text-lg">
          {pin.title}
        </h2>

        <p className="mt-3 text-sm text-neutral-600">
          {pin.latitude.toFixed(5)}, {pin.longitude.toFixed(5)}
        </p>

        {pin.description && (
          <p className="mt-3 text-sm leading-6 text-neutral-700">
            {pin.description}
          </p>
        )}

        <button
          type="button"
          onClick={onViewDetails}
          className="mt-4 w-full rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 sm:w-auto"
        >
          View details
        </button>
      </div>
    </div>
  );
}
