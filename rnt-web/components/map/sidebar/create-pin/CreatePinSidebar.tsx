"use client";

import { MapSidebarShell } from "../MapSidebarShell";
import { CreatePinPreviewCard } from "./CreatePinPreviewCard";
import { UploadedImageGrid } from "./UploadedImageGrid";
import type { CreatePinSidebarProps } from "./types";
import { useCreatePinForm } from "./useCreatePinForm";

export function CreatePinSidebar({
  open,
  pendingPin,
  previewPin,
  onClose,
  onSubmit,
  onViewDetails,
}: CreatePinSidebarProps) {
  const {
    form,
    error,
    isSubmitting,
    isUploading,
    selectedCountLabel,
    thumbnailUrl,
    updateTitle,
    updateDescription,
    selectThumbnail,
    removeImage,
    submitForm,
    handleImageChange,
    handleClose,
  } = useCreatePinForm({
    latitude: pendingPin?.lat,
    longitude: pendingPin?.lng,
    onClose,
    onSubmit,
  });

  return (
    <MapSidebarShell
      open={open}
      title="Create Pin"
      description="Add a new location to the map."
      onClose={handleClose}
    >
      <form className="space-y-4" onSubmit={submitForm}>
        {previewPin && (
          <CreatePinPreviewCard
            pin={previewPin}
            onViewDetails={onViewDetails}
          />
        )}

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-neutral-800">Title</label>
          <input
            type="text"
            value={form.title}
            onChange={(event) => updateTitle(event.target.value)}
            className="w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none transition focus:border-neutral-900"
            placeholder="Give this pin a name"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-800">Latitude</label>
            <input
              type="text"
              readOnly
              value={pendingPin ? pendingPin.lat.toFixed(6) : ""}
              className="w-full rounded-xl border border-neutral-200 bg-neutral-100 px-3 py-2 text-neutral-600 outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-800">Longitude</label>
            <input
              type="text"
              readOnly
              value={pendingPin ? pendingPin.lng.toFixed(6) : ""}
              className="w-full rounded-xl border border-neutral-200 bg-neutral-100 px-3 py-2 text-neutral-600 outline-none"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-neutral-800">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(event) => updateDescription(event.target.value)}
            rows={5}
            className="w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none transition focus:border-neutral-900"
            placeholder="Add a short description"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-neutral-800">Images</label>
            <span className="text-xs text-neutral-500">{selectedCountLabel}</span>
          </div>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="block w-full text-sm text-neutral-700 file:mr-3 file:rounded-full file:border-0 file:bg-neutral-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-neutral-800"
          />
          {isUploading && (
            <p className="text-sm text-neutral-500">Uploading images...</p>
          )}

          <UploadedImageGrid
            imageUrls={form.imageUrls}
            thumbnailIndex={form.thumbnailIndex}
            onSelectThumbnail={selectThumbnail}
            onRemoveImage={removeImage}
          />

          {thumbnailUrl && (
            <p className="text-xs text-neutral-500">
              The selected thumbnail will be shown in the map preview card.
            </p>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting || isUploading}
            className="rounded-full bg-neutral-900 px-5 py-2 text-sm font-medium text-white transition disabled:opacity-60"
          >
            {isSubmitting ? "Creating..." : "Create Pin"}
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full border border-neutral-300 px-5 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
          >
            Cancel
          </button>
        </div>
      </form>
    </MapSidebarShell>
  );
}
