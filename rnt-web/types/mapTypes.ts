import { LatLng } from "leaflet";
import { Pin, TileSummary } from "@/features/pins/types";
import { ServerAuthUser } from "@/lib/server-auth";

export type MapMode = "view" | "edit";
export type BasemapMode = "standard" | "imagery";

export interface PendingPin {
  lat: number;
  lng: number;
}

export interface MapViewport {
  north: number;
  south: number;
  east: number;
  west: number;
  zoom: number;
}

export type MapSidebarView = "create" | "details" | "edit" | null;

export type AddPinProps = {
  onAdd: (latlng: LatLng) => void;
};

export type MapViewProps = {
  pins: Pin[];
  tileSummaries: TileSummary[];
  mode: MapMode;
  basemap: BasemapMode;
  pendingPin: PendingPin | null;
  draftPin: PendingPin | null;
  onAddPin: (latlng: LatLng) => void;
  onViewportChange: (viewport: MapViewport) => void;
  onSelectPin: (pin: Pin) => void;
  onClearSelection: () => void;
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
  onViewDetails: () => void;
  onModeChange: (mode: MapMode) => void;
  onBasemapToggle: () => void;
  onLogout: () => Promise<void>;
}
