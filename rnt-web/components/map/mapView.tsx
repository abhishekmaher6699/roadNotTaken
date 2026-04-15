"use client";

import L from "leaflet";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import type { MapViewProps } from "@/types/mapTypes";
import { getPinIcon, getPreviewPinIcon } from "../../lib/mapIcons";
import { getSummaryIcon } from "./map-utils/summaryMarker";
import { FlyToController } from "./map-utils/FlyToController";
import { ViewportReporter } from "./map-utils/ViewportReporter";
import { AddPin, ClearSelectedPin } from "./map-utils/MapEventHandlers";
import { PendingPinPopup } from "./map-utils/PendingPinPopup";

const TILE_URLS = {
  standard: "https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png",
  imagery: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
};

const TILE_ATTRIBUTIONS = {
  standard: "© OpenStreetMap contributors",
  imagery: "Tiles © Esri",
};

export default function MapView({
  mapRef,
  pins,
  tileSummaries,
  mode,
  basemap,
  pendingPin,
  draftPin,
  flyToTarget,
  initialCenter,
  onAddPin,
  onViewportChange,
  onSelectPin,
  onClearSelection,
  onConfirmPin,
  onCancelPin,
}: MapViewProps) {
  return (
    <MapContainer
      ref={mapRef}
      center={initialCenter}
      zoom={15}
      className="z-0 h-full w-full"
      zoomControl={false}
      attributionControl={false}
      zoomDelta={0.5}
      zoomSnap={0.25}
      inertia={true}
      inertiaDeceleration={3000}
    >
      <TileLayer
        url={TILE_URLS[basemap]}
        attribution={TILE_ATTRIBUTIONS[basemap]}
      />

      <ViewportReporter onViewportChange={onViewportChange} />
      <FlyToController target={flyToTarget} />
      <ClearSelectedPin enabled={mode === "view" && !pendingPin} onClear={onClearSelection} />
      {mode === "edit" && !pendingPin && <AddPin onAdd={onAddPin} />}

      {pins.map((pin) => (
        <Marker
          key={pin.id}
          position={[pin.latitude, pin.longitude]}
          icon={getPinIcon(pin.category)}
          bubblingMouseEvents={false}
          eventHandlers={{
            click: () => {
              if (mode === "view") onSelectPin(pin);
            },
          }}
        />
      ))}

      {tileSummaries.map((summary) => (
        <Marker
          key={`${summary.z}-${summary.x}-${summary.y}`}
          position={[summary.latitude, summary.longitude]}
          icon={getSummaryIcon(summary.pin_count)}
          interactive={false}
          bubblingMouseEvents={false}
        />
      ))}

      {draftPin && (
        <Marker
          position={[draftPin.lat, draftPin.lng]}
          icon={getPreviewPinIcon()}
          bubblingMouseEvents={false}
        />
      )}

      {pendingPin && (
        <PendingPinPopup
          pendingPin={pendingPin}
          onConfirm={onConfirmPin}
          onCancel={onCancelPin}
        />
      )}
    </MapContainer>
  );
}
