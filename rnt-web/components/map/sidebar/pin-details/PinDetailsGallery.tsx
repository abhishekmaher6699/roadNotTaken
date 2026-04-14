"use client";

import { useMemo, useRef } from "react";
import LightGallery from "lightgallery/react";
import lgThumbnail from "lightgallery/plugins/thumbnail";
import lgZoom from "lightgallery/plugins/zoom";
import type { Pin } from "@/features/pins/types";

interface GalleryRef {
  openGallery: (index?: number) => void;
}

interface PinDetailsGalleryProps {
  pin: Pin;
}

export function PinDetailsGallery({ pin }: PinDetailsGalleryProps) {
  const galleryRef = useRef<GalleryRef | null>(null);

  const galleryItems = useMemo(
    () =>
      (pin.image_urls ?? [])
        .filter(Boolean)
        .map((imageUrl) => ({
          src: imageUrl,
          thumb: imageUrl,
          subHtml: `<h4>${pin.title}</h4>`,
        })),
    [pin.image_urls, pin.title]
  );

  if (galleryItems.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
            Gallery
          </p>
          <p className="mt-1 text-sm text-neutral-600">
            Tap an image to open the full gallery.
          </p>
        </div>
        <button
          type="button"
          onClick={() => galleryRef.current?.openGallery(0)}
          className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
        >
          Open gallery
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {galleryItems.slice(0, 6).map((item, index) => {
          const remaining = galleryItems.length - 6;
          const showOverflow = index === 5 && remaining > 0;

          return (
            <button
              key={`${item.src}-${index}`}
              type="button"
              onClick={() => galleryRef.current?.openGallery(index)}
              className="group relative overflow-hidden rounded-2xl border border-neutral-200 text-left"
            >
              <img
                src={item.thumb}
                alt={`${pin.title} ${index + 1}`}
                className="h-28 w-full object-cover transition duration-300 group-hover:scale-[1.03]"
              />
              {showOverflow && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-sm font-semibold text-white">
                  +{remaining}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="hidden">
        <LightGallery
          dynamic
          dynamicEl={galleryItems}
          container={() => document.body}
          plugins={[lgZoom, lgThumbnail]}
          onInit={(detail) => {
            galleryRef.current = detail.instance as unknown as GalleryRef;
          }}
          onBeforeOpen={() => {
            document.body.style.overflow = "hidden";
          }}
          onAfterClose={() => {
            document.body.style.overflow = "";
          }}
        />
      </div>
    </div>
  );
}
