"use client";

import { BasemapToggle } from "@/components/map/controls/BasemapToggle";
import { ModeSwitch } from "@/components/map/controls/ModeSwitch";
import { PinInfoCard } from "@/components/map/controls/PinInfoCard";
import { UserMenu } from "@/components/map/controls/UserMenu";
import type { MapPageOverlayProps } from "@/types/mapTypes";

export function MapOverlay({
  user,
  mode,
  basemap,
  selectedPin,
  onViewDetails,
  onModeChange,
  onBasemapToggle,
  onLogout,
}: MapPageOverlayProps) {
  return (
    <div className="map-overlay-shell pointer-events-none absolute inset-0 z-[2000]">
      <div className="pointer-events-auto absolute left-4 top-4">
        <ModeSwitch mode={mode} onChange={onModeChange} />
      </div>

      <div className="pointer-events-auto absolute right-4 top-4 flex flex-col items-end gap-3">
        <UserMenu
          initial={(user.email?.[0] ?? "U").toUpperCase()}
          email={user.email}
          onLogout={onLogout}
        />
        <BasemapToggle basemap={basemap} onToggle={onBasemapToggle} />
      </div>

      <div className="pointer-events-auto absolute bottom-4 left-4 w-[calc(100%-2rem)] max-w-sm">
        <PinInfoCard
          pin={selectedPin}
          mode={mode}
          onViewDetails={onViewDetails}
        />
      </div>
    </div>
  );
}
