import type L from "leaflet";
import { LatLng } from "leaflet";
import { Pin, TileSummary } from "@/features/pins/types";
import type { ProfileSearchResult } from "@/features/profiles";
import { ServerAuthUser } from "@/lib/server-auth";
import type { PinFilters } from "@/features/filter";

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
  mapRef: React.RefObject<L.Map | null>;
  pins: Pin[];
  tileSummaries: TileSummary[];
  mode: MapMode;
  basemap: BasemapMode;
  pendingPin: PendingPin | null;
  draftPin: PendingPin | null;
  flyToTarget: { lat: number; lng: number } | null;
  initialCenter: [number, number];
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

// Props passed down from the map page into the overlay so the search bar
// can fire selections that flow back up through the same onSelectPin handler.
export interface SearchOverlayProps {
  query: string;
  suggestions: Pin[];
  userSuggestions: ProfileSearchResult[];
  isSearching: boolean;
  isResultsPanelOpen: boolean;
  setQuery: (q: string) => void;
  search: () => void;
  clear: () => void;
  onSelectPin: (pin: Pin) => void;
  onSelectUser: (user: ProfileSearchResult) => void;
}

export interface FilterOverlayProps {
  filters: PinFilters;
  activeFilterCount: number;
  onToggleCategory: (value: string) => void;
  onToggleStatus: (value: string) => void;
  onToggleAccessLevel: (value: string) => void;
  onToggleVisitedOnly: () => void;
  onClearFilters: () => void;
}

// onLocate is called by the LocateButton after getting the browser GPS position.
export interface MapPageOverlayProps extends MapPageClientProps {
  mode: MapMode;
  basemap: BasemapMode;
  profileAvatarUrl?: string | null;
  selectedPin: Pin | null;
  search: SearchOverlayProps;
  filter: FilterOverlayProps;
  onViewDetails: () => void;
  onModeChange: (mode: MapMode) => void;
  onBasemapToggle: () => void;
  onLocate: (lat: number, lng: number) => void;
  onOpenProfile: () => void;
  onOpenProfileById: (userId: string) => void;
  onLogout: () => Promise<void>;
}
