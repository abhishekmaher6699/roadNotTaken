"use client";

import { useState } from "react";
import { ConfirmDialog } from "../../../ui/ConfirmDialog";
import { MapSidebarShell } from "../MapSidebarShell";
import { PinDetailsGallery } from "./PinDetailsGallery";
import { PinDetailsHero } from "./PinDetailsHero";
import { CommentsSection } from "./comment-section";
import type { PinDetailsSidebarProps } from "./types";

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
        {label}
      </p>
      <p className="mt-1.5 text-sm font-medium leading-6 text-neutral-800 sm:text-[15px]">
        {value}
      </p>
    </div>
  );
}

function formatDate(date?: string | null) {
  if (!date) {
    return "Unknown";
  }

  return new Date(date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function PinDetailsSidebar({
  open,
  pin,
  currentUserId,
  onClose,
  onEdit,
  onDelete,
}: PinDetailsSidebarProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const pinId = pin ? parseInt(pin.id) : null;

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
        <div className="space-y-4 pb-4 sm:space-y-5">
          <PinDetailsHero pin={pin} />

          <div className="flex flex-col gap-3 rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">
              <span>Overview</span>
              <span className="h-1 w-1 rounded-full bg-neutral-300" />
              <span>
                {pin.latitude.toFixed(4)}, {pin.longitude.toFixed(4)}
              </span>
            </div>

            {isOwner && (
              <div className="flex w-full gap-2 sm:w-auto">
                <button
                  type="button"
                  onClick={onEdit}
                  className="flex-1 rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 sm:flex-none"
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

          <section className="space-y-3 rounded-3xl border border-neutral-200 bg-white px-4 py-4 sm:px-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                Place data
              </p>
              <h3 className="mt-1 text-base font-semibold text-neutral-950">
                Archive snapshot
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <DetailItem label="Address" value={pin.address || "Unknown"} />
              <DetailItem label="Status" value={pin.status || "Unknown"} />
              <DetailItem
                label="Access level"
                value={pin.access_level || "Unknown"}
              />
              <DetailItem label="Posted by" value={pin.posted_by || "Unknown"} />
              <DetailItem
                label="Created on"
                value={formatDate(pin.created_at)}
              />
              <DetailItem
                label="Updated on"
                value={formatDate(pin.updated_at)}
              />
            </div>
          </section>

          {pin.description && (
            <section className="rounded-3xl border border-neutral-200 bg-white px-4 py-4 sm:px-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                Description
              </p>
              <p className="mt-2 text-[15px] leading-7 text-neutral-700">
                {pin.description}
              </p>
            </section>
          )}

          {gallery.length > 0 && <PinDetailsGallery pin={pin} />}

          <CommentsSection pinId={pinId} />
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
