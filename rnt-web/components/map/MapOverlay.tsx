"use client";

import { BasemapToggle } from "@/components/map/controls/BasemapToggle";
import { LocateButton } from "@/components/map/controls/LocateButton";
import { ModeSwitch } from "@/components/map/controls/ModeSwitch";
import { PinInfoCard } from "@/components/map/controls/PinInfoCard";
import { UserMenu } from "@/components/map/controls/UserMenu";
import { SearchBar } from "@/components/search/SearchBar";
import type { MapPageOverlayProps } from "@/types/mapTypes";

export function MapOverlay({
  user,
  mode,
  basemap,
  selectedPin,
  search,
  onViewDetails,
  onModeChange,
  onBasemapToggle,
  onLocate,
  onLogout,
}: MapPageOverlayProps) {
  return (
    <div className="map-overlay-shell pointer-events-none absolute inset-0 z-1000">
      <div className="pointer-events-auto absolute left-3 top-3 sm:left-4 sm:top-4">
        <ModeSwitch mode={mode} onChange={onModeChange} />
      </div>

      {/* Search bar — top-centre */}
      <div className="pointer-events-auto absolute left-1/2 top-3 w-full max-w-sm -translate-x-1/2 px-4 sm:top-4 sm:max-w-md">
        <SearchBar
          query={search.query}
          suggestions={search.suggestions}
          isSearching={search.isSearching}
          isResultsPanelOpen={search.isResultsPanelOpen}
          onQueryChange={search.setQuery}
          onSearch={search.search}
          onSelectPin={search.onSelectPin}
          onClear={search.clear}
        />
      </div>

      <div className="pointer-events-auto absolute right-3 top-3 flex flex-col items-end gap-2 sm:right-4 sm:top-4 sm:gap-3">
        <UserMenu
          initial={(user.email?.[0] ?? "U").toUpperCase()}
          email={user.email}
          onLogout={onLogout}
        />
        <BasemapToggle basemap={basemap} onToggle={onBasemapToggle} />
        <LocateButton onLocate={onLocate} />
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
