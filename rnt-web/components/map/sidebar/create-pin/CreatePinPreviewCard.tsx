"use client";

import type { CreatePinPreviewCardProps } from "./types";
import { getOptimizedCloudinaryUrl } from "@/lib/cloudinary";

export function CreatePinPreviewCard({
  pin,
  onViewDetails,
}: CreatePinPreviewCardProps) {
  const previewImageUrl = getOptimizedCloudinaryUrl(pin.thumbnail_url, "card");

  if (!previewImageUrl) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50">
      <img
        src={previewImageUrl}
        alt={pin.title}
        className="h-36 w-full object-cover"
      />
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-neutral-900">{pin.title}</p>
          <p className="text-xs text-neutral-500">
            {pin.latitude.toFixed(5)}, {pin.longitude.toFixed(5)}
          </p>
        </div>
        <button
          type="button"
          onClick={onViewDetails}
          className="rounded-full border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-100"
        >
          View details
        </button>
      </div>
    </div>
  );
}
