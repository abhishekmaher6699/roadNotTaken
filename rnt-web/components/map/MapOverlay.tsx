"use client";

import { FilterButton } from "@/features/filter";
import { LocateButton, BasemapToggle, ModeSwitch, UserMenu, PinInfoCard, ActivityButton } from "@/components/map/controls";
import { SearchBar } from "@/components/search";
import type { MapPageOverlayProps } from "@/types/mapTypes";

export function MapOverlay({
  user,
  mode,
  basemap,
  profileAvatarUrl,
  selectedPin,
  search,
  filter,
  onViewDetails,
  onModeChange,
  onBasemapToggle,
  onLocate,
  onOpenProfile,
  onOpenProfileById,
  onOpenFeed,
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
            userSuggestions={search.userSuggestions}
            isSearching={search.isSearching}
            isResultsPanelOpen={search.isResultsPanelOpen}
            onQueryChange={search.setQuery}
            onSearch={search.search}
            onSelectPin={search.onSelectPin}
            onSelectUser={search.onSelectUser}
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
            onToggleVisitedOnly={filter.onToggleVisitedOnly}
            onClear={filter.onClearFilters}
          />
        </div>
      </div>

      {/* User menu + right-side controls — top-right */}
      <div className="pointer-events-auto absolute right-3 top-3 flex flex-col items-end gap-2 sm:right-4 sm:top-4 sm:gap-3">
        <UserMenu
          initial={(user.email?.[0] ?? "U").toUpperCase()}
          email={user.email}
          avatarUrl={profileAvatarUrl}
          onOpenProfile={onOpenProfile}
          onLogout={onLogout}
        />
        {/* Desktop: basemap + locate + activity stacked vertically */}
        <div className="hidden flex-col items-end gap-3 sm:flex">
          <BasemapToggle basemap={basemap} onToggle={onBasemapToggle} />
          <LocateButton onLocate={onLocate} />
          <ActivityButton onClick={onOpenFeed} />
        </div>
      </div>

      {/* Mobile: basemap + locate + activity below user menu */}
      <div className="pointer-events-auto absolute right-3 top-16 flex flex-col items-end gap-2 sm:hidden">
        <BasemapToggle basemap={basemap} onToggle={onBasemapToggle} />
        <LocateButton onLocate={onLocate} />
        <ActivityButton onClick={onOpenFeed} />
      </div>

      <div className="pointer-events-auto absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-auto sm:w-[calc(100%-2rem)] sm:max-w-sm">
        <PinInfoCard
          pin={selectedPin}
          mode={mode}
          onViewDetails={onViewDetails}
          onOpenProfile={onOpenProfileById}
        />
      </div>
    </div>
  );
}
