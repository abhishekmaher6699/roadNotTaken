"use client";

import { useMemo } from "react";
import { MapSidebarShell } from "../MapSidebarShell";
import { PinFormFields } from "../pin-form/PinFormFields";
import { usePinForm } from "../pin-form/usePinForm";
import type { EditPinSidebarProps } from "./types";

export function EditPinSidebar({
  open,
  pin,
  onClose,
  onSubmit,
}: EditPinSidebarProps) {
  const initialValues = useMemo(
    () => ({
      title: pin?.title ?? "",
      category: pin?.category ?? "general",
      address: pin?.address ?? "",
      status: pin?.status ?? "active",
      accessLevel: pin?.access_level ?? "public",
      description: pin?.description ?? "",
      imageUrls:
        pin?.image_urls && pin.image_urls.length > 0
          ? pin.image_urls
          : pin?.thumbnail_url
            ? [pin.thumbnail_url]
            : [],
      thumbnailIndex:
        pin?.thumbnail_url && pin.image_urls?.length
          ? Math.max(pin.image_urls.indexOf(pin.thumbnail_url), 0)
          : pin?.thumbnail_url
            ? 0
            : null,
    }),
    [pin]
  );

  const formController = usePinForm({
    initialValues,
    onClose,
    onSubmit: async (values) => {
      if (!pin) {
        return;
      }

      await onSubmit(pin.id, values);
    },
  });

  return (
    <MapSidebarShell
      open={open}
      title="Edit Pin"
      description="Update the story, media, and archive details for this place."
      onClose={formController.handleClose}
    >
      <PinFormFields
        formController={formController}
        submitLabel="Save Changes"
        submitPendingLabel="Saving..."
      />
    </MapSidebarShell>
  );
}
