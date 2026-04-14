"use client";

import type { UploadedImageGridProps } from "./types";

export function UploadedImageGrid({
  imageUrls,
  thumbnailIndex,
  onSelectThumbnail,
  onRemoveImage,
}: UploadedImageGridProps) {
  if (imageUrls.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {imageUrls.map((imageUrl, index) => {
        const isThumbnail = thumbnailIndex === index;

        return (
          <div
            key={`${imageUrl}-${index}`}
            className={`overflow-hidden rounded-2xl border ${
              isThumbnail
                ? "border-neutral-900 ring-2 ring-neutral-900/10"
                : "border-neutral-200"
            }`}
          >
            <img
              src={imageUrl}
              alt={`Uploaded ${index + 1}`}
              className="h-24 w-full object-cover"
            />
            <div className="space-y-1 p-2">
              <button
                type="button"
                onClick={() => onSelectThumbnail(index)}
                className={`w-full rounded-full px-2 py-1 text-[11px] font-medium transition ${
                  isThumbnail
                    ? "bg-neutral-900 text-white"
                    : "border border-neutral-300 text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                {isThumbnail ? "Thumbnail" : "Set thumbnail"}
              </button>
              <button
                type="button"
                onClick={() => onRemoveImage(index)}
                className="w-full rounded-full border border-neutral-200 px-2 py-1 text-[11px] font-medium text-neutral-500 transition hover:bg-neutral-100"
              >
                Remove
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
