"use client";

import { FilterButton } from "@/features/filter";
import { LocateButton, BasemapToggle, ModeSwitch, UserMenu, PinInfoCard } from "@/components/map/controls";
import { SearchBar } from "@/components/search";
import type { MapPageOverlayProps } from "@/types/mapTypes";

export function MapOverlay({
  user,
  mode,
  basemap,
  selectedPin,
  search,
  filter,
  onViewDetails,
  onModeChange,
  onBasemapToggle,
  onLocate,
  onLogout,
}: MapPageOverlayProps) {
  return (
    <div className="map-overlay-shell pointer-events-none absolute inset-0 z-1000">
      <div className="pointer-events-auto absolute left-3 top-16 sm:left-4 sm:top-4">
        <ModeSwitch mode={mode} onChange={onModeChange} />
      </div>

      {/* Search bar + Filter button — top-centre */}
      <div className="pointer-events-auto absolute left-3 right-16 top-3 flex items-center gap-2 sm:left-1/2 sm:right-auto sm:top-4 sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:px-4">
        <div className="min-w-0 flex-1">
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
        <div className="shrink-0">
          <FilterButton
            filters={filter.filters}
            activeFilterCount={filter.activeFilterCount}
            onToggleCategory={filter.onToggleCategory}
            onToggleStatus={filter.onToggleStatus}
            onToggleAccessLevel={filter.onToggleAccessLevel}
            onClear={filter.onClearFilters}
          />
        </div>
      </div>

      <div className="pointer-events-auto absolute right-3 top-3 flex flex-col items-end gap-2 sm:right-4 sm:top-4 sm:gap-3">
        <UserMenu
          initial={(user.email?.[0] ?? "U").toUpperCase()}
          email={user.email}
          onLogout={onLogout}
        />
        <div className="hidden flex-col items-end gap-3 sm:flex">
          <BasemapToggle basemap={basemap} onToggle={onBasemapToggle} />
          <LocateButton onLocate={onLocate} />
        </div>
      </div>

      <div className="pointer-events-auto absolute right-3 top-16 flex flex-col items-end gap-2 sm:hidden">
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
