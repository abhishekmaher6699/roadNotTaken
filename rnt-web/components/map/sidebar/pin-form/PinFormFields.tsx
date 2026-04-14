"use client";

import type { PendingPin } from "@/types/mapTypes";
import type { PinFormController } from "./types";
import { UploadedImageGrid } from "./UploadedImageGrid";

interface PinFormFieldsProps {
  formController: PinFormController;
  location?: PendingPin | null;
  submitLabel: string;
  submitPendingLabel: string;
}

export function PinFormFields({
  formController,
  location,
  submitLabel,
  submitPendingLabel,
}: PinFormFieldsProps) {
  const {
    form,
    error,
    isSubmitting,
    isUploading,
    selectedCountLabel,
    thumbnailUrl,
    updateField,
    selectThumbnail,
    removeImage,
    submitForm,
    handleImageChange,
    handleClose,
  } = formController;

  return (
    <form className="space-y-4 pb-4" onSubmit={submitForm}>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-neutral-800">Title</label>
        <input
          type="text"
          value={form.title}
          onChange={(event) => updateField("title", event.target.value)}
          className="w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none transition focus:border-neutral-900"
          placeholder="Give this pin a name"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-neutral-800">Category</label>
        <select
          value={form.category}
          onChange={(event) => updateField("category", event.target.value)}
          className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 outline-none transition focus:border-neutral-900"
        >
          <option value="general">General</option>
          <option value="food">Food</option>
          <option value="nature">Nature</option>
          <option value="history">History</option>
          <option value="culture">Culture</option>
          <option value="architecture">Architecture</option>
          <option value="viewpoint">Viewpoint</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-neutral-800">Address</label>
        <input
          type="text"
          value={form.address}
          onChange={(event) => updateField("address", event.target.value)}
          className="w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none transition focus:border-neutral-900"
          placeholder="Nearest known address or locality"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-neutral-800">Status</label>
          <select
            value={form.status}
            onChange={(event) => updateField("status", event.target.value)}
            className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 outline-none transition focus:border-neutral-900"
          >
            <option value="active">Active</option>
            <option value="abandoned">Abandoned</option>
            <option value="ruined">Ruined</option>
            <option value="destroyed">Degrading</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-neutral-800">
            Access level
          </label>
          <select
            value={form.accessLevel}
            onChange={(event) => updateField("accessLevel", event.target.value)}
            className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 outline-none transition focus:border-neutral-900"
          >
            <option value="public">Public</option>
            <option value="restricted">Restricted</option>
            <option value="private">Private property</option>
            <option value="unsafe">Unsafe</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>
      </div>

      {location && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-800">Latitude</label>
            <input
              type="text"
              readOnly
              value={location.lat.toFixed(6)}
              className="w-full rounded-xl border border-neutral-200 bg-neutral-100 px-3 py-2 text-neutral-600 outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-800">Longitude</label>
            <input
              type="text"
              readOnly
              value={location.lng.toFixed(6)}
              className="w-full rounded-xl border border-neutral-200 bg-neutral-100 px-3 py-2 text-neutral-600 outline-none"
            />
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-neutral-800">
          Description
        </label>
        <textarea
          value={form.description}
          onChange={(event) => updateField("description", event.target.value)}
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

      <div className="flex flex-col gap-3 pt-2 sm:flex-row">
        <button
          type="submit"
          disabled={isSubmitting || isUploading}
          className="rounded-full bg-neutral-900 px-5 py-2 text-sm font-medium text-white transition disabled:opacity-60"
        >
          {isSubmitting ? submitPendingLabel : submitLabel}
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
  );
}
