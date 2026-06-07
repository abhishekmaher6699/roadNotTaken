"use client";

import Image from "next/image";
import type { PinInfoCardProps } from "./types";
import {
  getAuthorInitial,
  getPinAuthorAvatarUrl,
  getPinAuthorId,
  getPinAuthorName,
} from "@/features/pins/author";
import { getOptimizedCloudinaryUrl } from "@/lib/cloudinary";

export function PinInfoCard({
  pin,
  mode,
  onViewDetails,
  onOpenProfile,
}: PinInfoCardProps) {
  const previewImageUrl = getOptimizedCloudinaryUrl(
    pin?.thumbnail_url,
    "card-contain",
  );
  const authorName = pin ? getPinAuthorName(pin) : "";
  const authorId = pin ? getPinAuthorId(pin) : null;
  const authorAvatarUrl = pin ? getPinAuthorAvatarUrl(pin) : null;

  if (!pin) {
    return (
      <div className="rounded-2xl bg-white/95 p-3.5 shadow-lg ring-1 ring-black/10 backdrop-blur sm:p-4">
        <p className="text-sm font-semibold text-neutral-900">
          {mode === "view" ? "Pin details" : "Edit mode"}
        </p>
        <p className="mt-1.5 text-sm leading-5 text-neutral-600">
          {mode === "view"
            ? "Select a pin to view its details here."
            : "Click on the map to choose a location for a new pin."}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white/95 shadow-lg ring-1 ring-black/10 backdrop-blur">
      {previewImageUrl && (
        <div className="relative h-36 w-full sm:h-44">
          <Image
            src={previewImageUrl}
            alt={pin.title}
            fill
            sizes="(max-width: 640px) 100vw, 360px"
            className="object-contain"
          />
        </div>
      )}

      <div className="p-3.5 sm:p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
          Selected Pin
        </p>

        <h2 className="mt-1.5 line-clamp-2 text-base font-semibold leading-6 text-neutral-950">
          {pin.title}
        </h2>

        <p className="mt-1.5 text-xs text-neutral-500">
          {pin.latitude.toFixed(5)}, {pin.longitude.toFixed(5)}
        </p>

        {authorId && onOpenProfile && (
          <button
            type="button"
            onClick={() => onOpenProfile(authorId)}
            className="mt-2 flex max-w-full items-center gap-2 text-left"
          >
            {authorAvatarUrl ? (
              <span className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full">
                <Image
                  src={authorAvatarUrl}
                  alt=""
                  fill
                  sizes="24px"
                  className="object-cover"
                />
              </span>
            ) : (
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-[10px] font-semibold text-white">
                {getAuthorInitial(authorName)}
              </span>
            )}
            <span className="min-w-0 truncate border-b border-transparent text-xs font-semibold text-neutral-700 transition hover:border-neutral-700 hover:text-neutral-950">
              {authorName}
            </span>
          </button>
        )}

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full border border-rose-100 bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700">
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              className="h-3 w-3"
              fill="currentColor"
            >
              <path d="M10 17.2 3.9 11.5a4.2 4.2 0 0 1 0-6.1 4.1 4.1 0 0 1 5.8 0l.3.3.3-.3a4.1 4.1 0 0 1 5.8 0 4.2 4.2 0 0 1 0 6.1Z" />
            </svg>
            {pin.likes_count} likes
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-sky-100 bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-700">
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              className="h-3 w-3"
              fill="currentColor"
            >
              <path d="M4 4.8A2.8 2.8 0 0 1 6.8 2h6.4A2.8 2.8 0 0 1 16 4.8v4.4A2.8 2.8 0 0 1 13.2 12H9l-3.6 2.7c-.5.4-1.2 0-1.2-.6V12A2.8 2.8 0 0 1 4 9.2Z" />
            </svg>
            {pin.comment_count} comments
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              className="h-3 w-3"
              fill="currentColor"
            >
              <path d="M10 2.5a6.5 6.5 0 0 1 6.5 6.5c0 3.9-6.5 8.5-6.5 8.5S3.5 12.9 3.5 9A6.5 6.5 0 0 1 10 2.5Zm2.8 4.7-3.7 3.7-1.7-1.7-1.1 1.1 2.8 2.8 4.8-4.8-1.1-1.1Z" />
            </svg>
            {pin.visits_count} visits
          </span>
        </div>

        {pin.description && (
          <p className="mt-2 line-clamp-3 text-sm leading-5 text-neutral-700">
            {pin.description}
          </p>
        )}

        <button
          type="button"
          onClick={onViewDetails}
          className="mt-3 w-full rounded-full border border-neutral-300 px-3.5 py-1.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 sm:w-auto"
        >
          View details
        </button>
      </div>
    </div>
  );
}
