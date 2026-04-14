"use client";

import type { Pin } from "@/features/pins/types";
import { getOptimizedCloudinaryUrl } from "@/lib/cloudinary";

function formatCategory(category?: string | null) {
  if (!category) {
    return "General";
  }

  return category
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

interface PinDetailsHeroProps {
  pin: Pin;
}

export function PinDetailsHero({ pin }: PinDetailsHeroProps) {
  const heroImageUrl = getOptimizedCloudinaryUrl(pin.thumbnail_url, "hero");

  return (
    <div className="relative overflow-hidden rounded-4xl bg-neutral-950 text-white ring-1 ring-black/10">
      {heroImageUrl ? (
        <img
          src={heroImageUrl}
          alt={pin.title}
          className="h-72 w-full object-cover"
        />
      ) : (
        <div className="h-72 w-full bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_45%),linear-gradient(135deg,#171717,#404040)]" />
      )}

      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 p-6 sm:p-7">
        <p className="inline-flex rounded-full bg-white/14 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/90 ring-1 ring-white/15 backdrop-blur">
          {formatCategory(pin.category)}
        </p>
        <h2 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight text-white">
          {pin.title}
        </h2>
      </div>
    </div>
  );
}
