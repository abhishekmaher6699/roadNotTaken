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

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              className="h-3.5 w-3.5"
              fill="currentColor"
            >
              <path d="M10 17.2 3.9 11.5a4.2 4.2 0 0 1 0-6.1 4.1 4.1 0 0 1 5.8 0l.3.3.3-.3a4.1 4.1 0 0 1 5.8 0 4.2 4.2 0 0 1 0 6.1Z" />
            </svg>
            {pin.likes_count} likes
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              className="h-3.5 w-3.5"
              fill="currentColor"
            >
              <path d="M4 4.8A2.8 2.8 0 0 1 6.8 2h6.4A2.8 2.8 0 0 1 16 4.8v4.4A2.8 2.8 0 0 1 13.2 12H9l-3.6 2.7c-.5.4-1.2 0-1.2-.6V12A2.8 2.8 0 0 1 4 9.2Z" />
            </svg>
            {pin.comment_count} comments
          </span>
        </div>

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
