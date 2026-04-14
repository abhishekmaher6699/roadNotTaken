"use client";

import { useEffect } from "react";
import L from "leaflet";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { AddPinProps, MapViewProps } from "@/types/mapTypes";
import { getPinIcon, getPreviewPinIcon } from "./mapIcons";

const summaryIconCache = new Map<number, L.DivIcon>();

function getSummaryMarkerSize(pinCount: number) {
  if (pinCount >= 50) return 52;
  if (pinCount >= 20) return 46;
  if (pinCount >= 10) return 40;

  return 34;
}

function getSummaryIcon(pinCount: number) {
  const size = getSummaryMarkerSize(pinCount);
  const cached = summaryIconCache.get(size);

  if (cached) {
    return cached;
  }

  const icon = L.divIcon({
    className: "map-summary-marker",
    html: `
      <div style="
        width:${size}px;
        height:${size}px;
        border-radius:999px;
        display:flex;
        align-items:center;
        justify-content:center;
        background:rgba(15,23,42,0.92);
        color:#fff;
        border:2px solid rgba(255,255,255,0.95);
        box-shadow:0 12px 30px rgba(15,23,42,0.22);
        font-size:${size >= 46 ? "13px" : "12px"};
        font-weight:700;
      ">${pinCount}</div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });

  summaryIconCache.set(size, icon);

  return icon;
}

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

function ViewportReporter({
  onViewportChange,
}: {
  onViewportChange: MapViewProps["onViewportChange"];
}) {
  const map = useMap();

  const reportViewport = () => {
    const bounds = map.getBounds();
    const viewport = {
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest(),
      zoom: map.getZoom(),
    };

    onViewportChange(viewport);
  };

  useMapEvents({
    moveend: reportViewport,
    zoomend: reportViewport,
  });

  useEffect(() => {
    reportViewport();
  }, []);

  return null;
}

export default function MapView({
  pins,
  tileSummaries,
  mode,
  basemap,
  pendingPin,
  draftPin,
  onAddPin,
  onViewportChange,
  onSelectPin,
  onClearSelection,
  onConfirmPin,
  onCancelPin,
}: MapViewProps) {
  return (
    <MapContainer
      center={[18.52, 73.85]}
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

      <ViewportReporter onViewportChange={onViewportChange} />

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

      {tileSummaries.map((summary) => (
        <Marker
          key={`${summary.z}-${summary.x}-${summary.y}`}
          position={[summary.latitude, summary.longitude]}
          icon={getSummaryIcon(summary.pin_count)}
          interactive={false}
          bubblingMouseEvents={false}
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
