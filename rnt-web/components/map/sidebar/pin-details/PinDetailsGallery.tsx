"use client";

import { useEffect, useMemo, useState } from "react";
import type { Pin } from "@/features/pins";
import { getOptimizedCloudinaryUrl } from "@/lib/cloudinary";
import Lightbox from "yet-another-react-lightbox";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";

interface PinDetailsGalleryProps {
  pin: Pin;
}

export function PinDetailsGallery({ pin }: PinDetailsGalleryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const gallerySlides = useMemo(
    () =>
      (pin.image_urls ?? [])
        .filter(Boolean)
        .map((imageUrl) => ({
          src: imageUrl,
          alt: pin.title,
        })),
    [pin.image_urls, pin.title]
  );

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("gallery-open");
      document.body.style.overflow = "hidden";
      return () => {
        document.body.classList.remove("gallery-open");
        document.body.style.overflow = "";
      };
    }

    document.body.classList.remove("gallery-open");
    document.body.style.overflow = "";
  }, [isOpen]);

  if (gallerySlides.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2.5 rounded-2xl border border-neutral-200 bg-white px-3.5 py-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
            Gallery
          </p>
          <p className="mt-0.5 text-sm font-semibold text-neutral-950">
            Photos
          </p>
          <p className="mt-0.5 text-xs text-neutral-500">
            Tap an image to open the full gallery.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setActiveIndex(0);
            setIsOpen(true);
          }}
          className="w-fit rounded-full border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-100"
        >
          Open gallery
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {gallerySlides.slice(0, 6).map((item, index) => {
          const remaining = gallerySlides.length - 6;
          const showOverflow = index === 5 && remaining > 0;

          return (
            <button
              key={`${item.src}-${index}`}
              type="button"
              onClick={() => {
                setActiveIndex(index);
                setIsOpen(true);
              }}
              className="group relative overflow-hidden rounded-xl border border-neutral-200 text-left"
            >
              <img
                src={getOptimizedCloudinaryUrl(item.src, "gallery-preview") ?? item.src}
                alt={`${pin.title} ${index + 1}`}
                className="h-20 w-full object-cover transition duration-300 group-hover:scale-[1.03] sm:h-24"
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

      <Lightbox
        open={isOpen}
        close={() => setIsOpen(false)}
        index={activeIndex}
        slides={gallerySlides}
        plugins={[Thumbnails, Zoom]}
      />
    </div>
  );
}
