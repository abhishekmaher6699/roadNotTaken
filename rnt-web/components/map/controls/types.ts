import type { Pin } from "@/features/pins/types";
import type { BasemapMode, MapMode } from "@/types/mapTypes";

export interface ModeSwitchProps {
  mode: MapMode;
  onChange: (mode: MapMode) => void;
}

export interface BasemapToggleProps {
  basemap: BasemapMode;
  onToggle: () => void;
}

export interface UserMenuProps {
  initial: string;
  email?: string;
  onLogout: () => Promise<void>;
}

export interface PinInfoCardProps {
  pin: Pin | null;
  mode: MapMode;
  onViewDetails: () => void;
}
