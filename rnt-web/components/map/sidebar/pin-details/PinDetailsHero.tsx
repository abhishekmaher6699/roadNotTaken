"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import type { Pin } from "@/features/pins";
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
  actions?: ReactNode;
}

export function PinDetailsHero({ pin, actions }: PinDetailsHeroProps) {
  const heroImageUrl = getOptimizedCloudinaryUrl(
    pin.thumbnail_url,
    "hero-contain",
  );

  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-neutral-950 text-white ring-1 ring-black/10">
      {heroImageUrl ? (
        <div className="relative h-72 w-full sm:h-80">
          <Image
            src={heroImageUrl}
            alt={pin.title}
            fill
            sizes="(max-width: 640px) 100vw, 720px"
            priority
            className="object-contain"
          />
        </div>
      ) : (
        <div className="h-72 w-full bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_45%),linear-gradient(135deg,#171717,#404040)] sm:h-80" />
      )}

      <div className="absolute inset-0 z-20 bg-linear-to-t from-black/88 via-black/18 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 z-30 p-4 sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="inline-flex rounded-full bg-white/14 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/90 ring-1 ring-white/15">
              {formatCategory(pin.category)}
            </p>
            <h2 className="mt-2 max-w-2xl text-2xl font-semibold leading-tight text-white sm:text-[1.75rem]">
              {pin.title}
            </h2>
          </div>
          {actions && (
            <div className="flex shrink-0 items-center gap-1.5 sm:pb-1">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
