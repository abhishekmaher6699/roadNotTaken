import { LatLng } from "leaflet";
import { Pin } from "@/features/pins/types";
import { ServerAuthUser } from "@/lib/server-auth";

export type MapMode = "view" | "edit";
export type BasemapMode = "standard" | "imagery";

export interface PendingPin {
  lat: number;
  lng: number;
}

export type AddPinProps = {
  onAdd: (latlng: LatLng) => void;
};

export type MapViewProps = {
  pins: Pin[];
  mode: MapMode;
  basemap: BasemapMode;
  pendingPin: PendingPin | null;
  selectedPin: Pin | null;
  onAddPin: (latlng: LatLng) => void;
  onSelectPin: (pin: Pin) => void;
  onConfirmPin: () => void;
  onCancelPin: () => void;
};

export interface MapPageClientProps {
  user: ServerAuthUser;
}

export interface MapPageOverlayProps extends MapPageClientProps {
  mode: MapMode;
  basemap: BasemapMode;
  selectedPin: Pin | null;
  onModeChange: (mode: MapMode) => void;
  onBasemapToggle: () => void;
  onLogout: () => Promise<void>;
}
