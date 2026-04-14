"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { MapSidebarShell } from "../MapSidebarShell";
import { PinDetailsGallery } from "./PinDetailsGallery";
import { PinDetailsHero } from "./PinDetailsHero";
import type { PinDetailsSidebarProps } from "./types";

export function PinDetailsSidebar({
  open,
  pin,
  currentUserId,
  onClose,
  onDelete,
}: PinDetailsSidebarProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!pin) {
    return null;
  }

  const isOwner = pin.user_id === currentUserId;
  const gallery = pin.image_urls ?? (pin.thumbnail_url ? [pin.thumbnail_url] : []);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete(pin.id);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      <MapSidebarShell
        open={open}
        title="Pin Details"
        description="Explore the full story of this place."
        onClose={onClose}
        size="wide"
      >
        <div className="space-y-5 pb-4 sm:space-y-6">
          <PinDetailsHero pin={pin} />

          <div className="flex flex-col gap-3 rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.16em] text-neutral-500">
              <span>Pin overview</span>
              <span className="h-1 w-1 rounded-full bg-neutral-300" />
              <span>
                {pin.latitude.toFixed(4)}, {pin.longitude.toFixed(4)}
              </span>
            </div>

            {isOwner && (
              <div className="flex w-full gap-2 sm:w-auto">
                <button
                  type="button"
                  disabled
                  className="flex-1 rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-400 sm:flex-none"
                  title="Edit form comes next"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex-1 rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 sm:flex-none"
                >
                  Delete
                </button>
              </div>
            )}
          </div>

          {pin.description && (
            <section className="rounded-3xl border border-neutral-200 bg-white px-4 py-4 sm:px-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                Description
              </p>
              <p className="mt-3 text-sm leading-7 text-neutral-700">
                {pin.description}
              </p>
            </section>
          )}

          {gallery.length > 0 && <PinDetailsGallery pin={pin} />}

          <section className="rounded-3xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-5 sm:px-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Community Space
            </p>
            <p className="mt-3 text-sm leading-6 text-neutral-600">
              This area is ready for comments, replies, reactions, saves, and
              future social activity without needing to rework the layout later.
            </p>
          </section>
        </div>
      </MapSidebarShell>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete this pin?"
        description="This action removes the pin from the map. You can add a new one later, but this specific post will be gone."
        confirmLabel="Delete pin"
        cancelLabel="Keep pin"
        tone="danger"
        isConfirming={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}
