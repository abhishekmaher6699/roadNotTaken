import { LatLng } from "leaflet";

export type AddPinProps = {
  onAdd: (latlng: LatLng) => void;
};

export type MapViewProps = {
  pins: any[];
  onAddPin: (latlng: LatLng) => void;
};
