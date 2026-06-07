"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { ConfirmDialog } from "../../../ui/ConfirmDialog";
import { LikeButton } from "../../../ui/LikeButton";
import { MapSidebarShell } from "../MapSidebarShell";
import { PinDetailsGallery } from "./PinDetailsGallery";
import { PinDetailsHero } from "./PinDetailsHero";
import { CommentsSection } from "./comment-section";
import {
  getAuthorInitial,
  getPinAuthorAvatarUrl,
  getPinAuthorId,
  getPinAuthorName,
} from "@/features/pins/author";
import type { PinDetailsSidebarProps } from "./types";

function DetailItem({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-neutral-100 py-2.5 last:border-b-0">
      <p className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
        {label}
      </p>
      {children ?? (
        <p className="min-w-0 text-right text-sm font-medium leading-5 text-neutral-800">
          {value}
        </p>
      )}
    </div>
  );
}

function SectionTitle({
  title,
}: {
  title: string;
}) {
  return (
    <div>
      <h3 className="mt-0.5 text-sm font-semibold text-neutral-950">
        {title}
      </h3>
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
  onToggleLike,
  onToggleVisit,
  onOpenProfile,
  focusedCommentId,
  onCommentCountChange,
  onCommentCountSync,
}: PinDetailsSidebarProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const pinId = pin ? parseInt(pin.id) : null;

  if (!pin) {
    return null;
  }

  const isOwner = pin.user_id === currentUserId;
  const gallery = pin.image_urls ?? (pin.thumbnail_url ? [pin.thumbnail_url] : []);
  const postedBy = getPinAuthorName(pin);
  const authorId = getPinAuthorId(pin);
  const authorAvatarUrl = getPinAuthorAvatarUrl(pin);
  const authorInitial = getAuthorInitial(postedBy);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete(pin.id);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleLikeClick = async () => {
    await onToggleLike(pin);
  };

  const handleVisitClick = async () => {
    await onToggleVisit(pin);
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
        <div className="space-y-3 pb-4">
          <PinDetailsHero
            pin={pin}
            actions={
              isOwner ? (
                <>
                  <button
                    type="button"
                    onClick={onEdit}
                    className="rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-xs font-semibold text-white shadow-sm backdrop-blur transition hover:bg-white/25"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="rounded-full border border-red-200/30 bg-red-500/80 px-3 py-1.5 text-xs font-semibold text-white shadow-sm backdrop-blur transition hover:bg-red-500"
                  >
                    Delete
                  </button>
                </>
              ) : undefined
            }
          />

          <div className="flex flex-col gap-2.5 rounded-2xl border border-neutral-200 bg-white px-3.5 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
              <span>Overview</span>
              <span className="h-1 w-1 rounded-full bg-neutral-300" />
              <span>
                {pin.latitude.toFixed(4)}, {pin.longitude.toFixed(4)}
              </span>
            </div>

            <div className="flex w-full flex-wrap items-center gap-1.5 sm:w-auto sm:justify-end">
              <LikeButton
                liked={pin.viewer_has_liked}
                count={pin.likes_count}
                onClick={handleLikeClick}
                label="Like"
                className="min-h-0 px-3 py-1.5 text-xs [&>svg]:h-3.5 [&>svg]:w-3.5"
              />
              <LikeButton
                liked={pin.viewer_has_visited}
                count={pin.visits_count}
                onClick={handleVisitClick}
                label="Visit"
                activeLabel="Visited"
                tone="visit"
                className="min-h-0 px-3 py-1.5 text-xs [&>svg]:h-3.5 [&>svg]:w-3.5"
              />
            </div>
          </div>

          <section className="space-y-2.5 rounded-2xl border border-neutral-200 bg-white px-3.5 py-3">
            <SectionTitle title="Archive snapshot" />

            <div>
              <DetailItem label="Address" value={pin.address || "Unknown"} />
              <DetailItem label="Status" value={pin.status || "Unknown"} />
              <DetailItem
                label="Access level"
                value={pin.access_level || "Unknown"}
              />
              <DetailItem label="Posted by" value={postedBy}>
                {authorId && onOpenProfile ? (
                  <button
                    type="button"
                    onClick={() => onOpenProfile(authorId)}
                    className="flex min-w-0 items-center gap-2 text-right transition hover:text-neutral-950"
                  >
                    {authorAvatarUrl ? (
                      <img
                        src={authorAvatarUrl}
                        alt=""
                        className="h-6 w-6 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-[10px] font-semibold text-white">
                        {authorInitial}
                      </span>
                    )}
                    <span className="min-w-0 truncate border-b border-transparent text-sm font-semibold leading-5 text-neutral-950 transition hover:border-neutral-950">
                      {postedBy}
                    </span>
                  </button>
                ) : undefined}
              </DetailItem>
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
            <section className="rounded-2xl border border-neutral-200 bg-white px-3.5 py-3">
              <SectionTitle title="Notes" />
              <p className="mt-2 text-sm leading-6 text-neutral-700">
                {pin.description}
              </p>
            </section>
          )}

          {gallery.length > 0 && <PinDetailsGallery pin={pin} />}

          {open && (
            <CommentsSection
              pinId={pinId}
              onOpenProfile={onOpenProfile}
              focusedCommentId={focusedCommentId}
              onCommentCountChange={(delta) =>
                onCommentCountChange?.(pin.id, delta)
              }
              onCommentCountSync={(count) => onCommentCountSync?.(pin.id, count)}
            />
          )}
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
