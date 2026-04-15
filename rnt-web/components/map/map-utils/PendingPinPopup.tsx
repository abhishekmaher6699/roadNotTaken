"use client";

import { Popup } from "react-leaflet";
import type { PendingPin } from "@/types/mapTypes";

interface PendingPinPopupProps {
  pendingPin: PendingPin;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Popup shown over a freshly-placed pin asking the user to confirm or cancel. */
export function PendingPinPopup({
  pendingPin,
  onConfirm,
  onCancel,
}: PendingPinPopupProps) {
  return (
    <Popup
      position={[pendingPin.lat, pendingPin.lng]}
      closeButton={false}
      closeOnClick={false}
    >
      <div
        className="space-y-2 px-1 py-1"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <p className="text-sm font-medium text-neutral-900">
          Confirm this location?
        </p>
        <p className="text-xs text-neutral-500">
          {pendingPin.lat.toFixed(5)}, {pendingPin.lng.toFixed(5)}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onConfirm(); }}
            className="rounded bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white"
          >
            Confirm
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onCancel(); }}
            className="rounded border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </Popup>
  );
}
