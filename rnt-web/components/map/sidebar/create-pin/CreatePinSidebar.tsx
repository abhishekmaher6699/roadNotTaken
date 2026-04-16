"use client";

import { MapSidebarShell } from "../MapSidebarShell";
import { CreatePinPreviewCard } from "./CreatePinPreviewCard";
import { PinFormFields } from "../pin-form";
import { usePinForm } from "@/features/map/forms";
import type { CreatePinSidebarProps } from "./types";
import type { CreatePinInput } from "@/features/pins";

export function CreatePinSidebar({
  open,
  pendingPin,
  previewPin,
  onClose,
  onSubmit,
  onViewDetails,
}: CreatePinSidebarProps) {
  const formController = usePinForm({
    latitude: pendingPin?.lat,
    longitude: pendingPin?.lng,
    onClose,
    onSubmit: async (values) => onSubmit(values as CreatePinInput),
  });

  return (
    <MapSidebarShell
      open={open}
      title="Create Pin"
      description="Add a new location to the map."
      onClose={formController.handleClose}
    >
      <div className="space-y-4 pb-4">
        {previewPin && (
          <CreatePinPreviewCard
            pin={previewPin}
            onViewDetails={onViewDetails}
          />
        )}

        <PinFormFields
          formController={formController}
          location={pendingPin}
          submitLabel="Create Pin"
          submitPendingLabel="Creating..."
        />
      </div>
    </MapSidebarShell>
  );
}
