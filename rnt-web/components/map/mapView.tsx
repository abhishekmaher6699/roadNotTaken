"use client";

import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMapEvents,
} from "react-leaflet";
import { AddPinProps, MapViewProps } from "@/types/mapTypes";
import { getPinIcon, getPreviewPinIcon } from "./mapIcons";

function AddPin({ onAdd }: AddPinProps) {
  useMapEvents({
    click(event) {
      onAdd(event.latlng);
    },
  });

  return null;
}

function ClearSelectedPin({
  enabled,
  onClear,
}: {
  enabled: boolean;
  onClear: () => void;
}) {
  useMapEvents({
    click() {
      if (enabled) {
        onClear();
      }
    },
  });

  return null;
}

export default function MapView({
  pins,
  mode,
  basemap,
  pendingPin,
  draftPin,
  onAddPin,
  onSelectPin,
  onClearSelection,
  onConfirmPin,
  onCancelPin,
}: MapViewProps) {
  return (
    <MapContainer
      center={[18.52, 73.85]}
      zoom={13}
      className="z-0 h-full w-full"
      zoomControl={false}
      attributionControl={false}
      zoomDelta={0.5}
      zoomSnap={0.25}
      inertia={true}
      inertiaDeceleration={3000}
    >
      <TileLayer
        url={
          basemap === "imagery"
            ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            : "https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png"
        }
        attribution={
          basemap === "imagery"
            ? "Tiles © Esri"
            : "© OpenStreetMap contributors"
        }
      />

      {pins.map((pin) => (
        <Marker
          key={pin.id}
          position={[pin.latitude, pin.longitude]}
          icon={getPinIcon(pin.category)}
          bubblingMouseEvents={false}
          eventHandlers={{
            click: () => {
              if (mode === "view") {
                onSelectPin(pin);
              }
            },
          }}
        />
      ))}

      <ClearSelectedPin
        enabled={mode === "view" && !pendingPin}
        onClear={onClearSelection}
      />

      {draftPin && (
        <Marker
          position={[draftPin.lat, draftPin.lng]}
          icon={getPreviewPinIcon()}
          bubblingMouseEvents={false}
        />
      )}

      {pendingPin && (
        <Popup
          position={[pendingPin.lat, pendingPin.lng]}
          closeButton={false}
          closeOnClick={false}
        >
          <div
            className="space-y-2 px-1 py-1"
            onClick={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
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
                onClick={(event) => {
                  event.stopPropagation();
                  onConfirmPin();
                }}
                className="rounded bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onCancelPin();
                }}
                className="rounded border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </Popup>
      )}

      {mode === "edit" && !pendingPin && <AddPin onAdd={onAddPin} />}
    </MapContainer>
  );
}
