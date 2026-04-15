"use client";

import { useRef, useState } from "react";
import type L from "leaflet";
import dynamic from "next/dynamic";

import { MapOverlay } from "@/components/map/MapOverlay";
import { CreatePinSidebar } from "@/components/map/sidebar/create-pin";
import { EditPinSidebar } from "@/components/map/sidebar/edit-pin";
import { PinDetailsSidebar } from "@/components/map/sidebar/pin-details";
import { SearchResultsPanel } from "@/components/search/SearchResultsPanel";
import { useMapPageState } from "@/hooks/map/useMapPageState";
import { useSearch } from "@/hooks/search/useSearch";
import { useDisplayedPins } from "@/hooks/pins/useDisplayedPins";
import { usePinFilters } from "@/hooks/pins/usePinFilters";
import { loadLocation } from "@/components/map/controls/LocateButton";
import type { MapPageClientProps, MapViewport } from "@/types/mapTypes";
import type { Pin } from "@/features/pins/types";

const MapView = dynamic(() => import("@/components/map/mapView"), {
  ssr: false,
});

// Default map center — Pune. Overridden by saved location if available.
const DEFAULT_CENTER: [number, number] = [18.52, 73.85];

function getInitialCenter(): [number, number] {
  const saved = loadLocation();
  return saved ? [saved.lat, saved.lng] : DEFAULT_CENTER;
}

export function MapPageClient({ user }: MapPageClientProps) {
  // Computed once at mount — MapContainer only reads center on first render.
  const [initialCenter] = useState<[number, number]>(getInitialCenter);

  const mapRef = useRef<L.Map | null>(null);
  const viewportRef = useRef<MapViewport | null>(null);

  // flyToTarget is set by search selection or locate button; FlyToController reacts to it.
  const [flyToTarget, setFlyToTarget] = useState<{ lat: number; lng: number } | null>(null);

  const {
    pins,
    tileSummaries,
    mode,
    basemap,
    pendingPin,
    draftPin,
    selectedPin,
    sidebarView,
    setSelectedPin,
    handleLogout,
    handleAddPin,
    handleConfirmPin,
    handleCancelPin,
    handleModeChange,
    handleBasemapToggle,
    handleViewportChange,
    handleCreatePin,
    handleStartEditPin,
    handleUpdatePin,
    handleDeletePin,
    handleClearSelection,
    handleCloseSidebar,
    handleViewDetails,
  } = useMapPageState();

  const search = useSearch(mapRef);

  const {
    filters,
    activeFilterCount,
    isFiltersActive,
    applyFilters,
    clearFilters,
    toggleCategory,
    toggleStatus,
    toggleAccessLevel,
  } = usePinFilters();

  // When filters are active, apply them before displaying; otherwise show all tile pins.
  const filteredPins = isFiltersActive ? applyFilters(pins) : pins;

  const displayedPins = useDisplayedPins(
    filteredPins,
    search.results,
    search.isResultsPanelOpen,
    viewportRef.current
  );
  const displayedSummaries = search.isResultsPanelOpen ? [] : tileSummaries;

  // Keep viewportRef in sync for useDisplayedPins without triggering re-renders.
  function handleViewportChangeWithRef(vp: MapViewport) {
    viewportRef.current = vp;
    handleViewportChange(vp);
  }

  function handleLocate(lat: number, lng: number) {
    setFlyToTarget({ lat, lng });
  }

  function handleSearchSelectPin(pin: Pin | null) {
    if (!pin) return;
    setFlyToTarget({ lat: pin.latitude, lng: pin.longitude });
    setSelectedPin(pin);
    handleViewDetails();
    search.clear();
  }

  return (
    <div className="relative h-screen overflow-hidden bg-neutral-100">
      <MapView
        mapRef={mapRef}
        pins={displayedPins}
        tileSummaries={displayedSummaries}
        mode={mode}
        basemap={basemap}
        pendingPin={pendingPin}
        draftPin={draftPin}
        flyToTarget={flyToTarget}
        initialCenter={initialCenter}
        onAddPin={handleAddPin}
        onViewportChange={handleViewportChangeWithRef}
        onSelectPin={setSelectedPin}
        onClearSelection={handleClearSelection}
        onConfirmPin={handleConfirmPin}
        onCancelPin={handleCancelPin}
      />

      <MapOverlay
        user={user}
        mode={mode}
        basemap={basemap}
        selectedPin={selectedPin}
        search={{
          query: search.query,
          suggestions: search.suggestions,
          isSearching: search.isSearching,
          isResultsPanelOpen: search.isResultsPanelOpen,
          setQuery: search.setQuery,
          search: search.search,
          clear: search.clear,
          onSelectPin: handleSearchSelectPin,
        }}
        filter={{
          filters,
          activeFilterCount,
          onToggleCategory: toggleCategory,
          onToggleStatus: toggleStatus,
          onToggleAccessLevel: toggleAccessLevel,
          onClearFilters: clearFilters,
        }}
        onViewDetails={handleViewDetails}
        onModeChange={handleModeChange}
        onBasemapToggle={handleBasemapToggle}
        onLocate={handleLocate}
        onLogout={handleLogout}
      />

      <CreatePinSidebar
        open={sidebarView === "create"}
        pendingPin={draftPin}
        previewPin={selectedPin}
        onClose={handleCloseSidebar}
        onSubmit={handleCreatePin}
        onViewDetails={handleViewDetails}
      />

      <EditPinSidebar
        open={sidebarView === "edit"}
        pin={selectedPin}
        onClose={handleCloseSidebar}
        onSubmit={handleUpdatePin}
      />

      <PinDetailsSidebar
        open={sidebarView === "details"}
        pin={selectedPin}
        currentUserId={user.id}
        onClose={handleCloseSidebar}
        onEdit={handleStartEditPin}
        onDelete={handleDeletePin}
      />

      <SearchResultsPanel
        open={search.isResultsPanelOpen}
        query={search.query}
        results={search.results}
        isSearching={search.isSearching}
        onSelect={handleSearchSelectPin}
        onClose={search.clear}
      />
    </div>
  );
}
