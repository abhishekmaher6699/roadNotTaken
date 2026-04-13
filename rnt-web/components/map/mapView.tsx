"use client";

import L from "leaflet";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
} from "react-leaflet";

import { AddPinProps, MapViewProps } from "@/types/mapTypes";


delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});


function AddPin({ onAdd }: AddPinProps) {
  useMapEvents({
    click(e) {
      onAdd(e.latlng);
    },
  });

  return null;
}

export default function MapView({
  pins,
  onAddPin,
}: MapViewProps) {

  return (
    <MapContainer
      center={[18.52, 73.85]}
      zoom={13}
      className="h-full w-full"
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {pins.map((pin) => (
        <Marker
          key={pin.id}
          position={[pin.latitude, pin.longitude]}
        />
      ))}

      {/* <AddPin onAdd={onAddPin} /> */}
    </MapContainer>
  );
}