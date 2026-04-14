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
      <div className="pointer-events-auto absolute left-3 top-3 sm:left-4 sm:top-4">
        <ModeSwitch mode={mode} onChange={onModeChange} />
      </div>

      <div className="pointer-events-auto absolute right-3 top-3 flex flex-col items-end gap-2 sm:right-4 sm:top-4 sm:gap-3">
        <UserMenu
          initial={(user.email?.[0] ?? "U").toUpperCase()}
          email={user.email}
          onLogout={onLogout}
        />
        <BasemapToggle basemap={basemap} onToggle={onBasemapToggle} />
      </div>

      <div className="pointer-events-auto absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-auto sm:w-[calc(100%-2rem)] sm:max-w-sm">
        <PinInfoCard
          pin={selectedPin}
          mode={mode}
          onViewDetails={onViewDetails}
        />
      </div>
    </div>
  );
}
