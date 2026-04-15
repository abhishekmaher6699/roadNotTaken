"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import { MapOverlay } from "@/components/map/MapOverlay";
import { CreatePinSidebar } from "@/components/map/sidebar/create-pin";
import { EditPinSidebar } from "@/components/map/sidebar/edit-pin";
import { PinDetailsSidebar } from "@/components/map/sidebar/pin-details";
import { SearchResultsPanel } from "@/components/search/SearchResultsPanel";
import { useMapPageState } from "@/hooks/useMapPageState";
import { useSearch } from "@/features/search/useSearch";
import type { MapPageClientProps, MapViewport } from "@/types/mapTypes";
import type { Pin } from "@/features/pins/types";

const MapView = dynamic(() => import("@/components/map/mapView"), {
  ssr: false,
});

export function MapPageClient({ user }: MapPageClientProps) {
  // A ref so the search hook can read the latest viewport without causing re-renders.
  const viewportRef = useRef<MapViewport | null>(null);

  // flyToTarget is set by search selection; MapView's FlyToController reacts to it.
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

  const search = useSearch(viewportRef);

  // Intercept viewport changes so we can keep the ref up-to-date for the search hook.
  function handleViewportChangeWithRef(vp: MapViewport) {
    viewportRef.current = vp;
    handleViewportChange(vp);
  }

  // When the user has an active search, only render matching pins that are
  // currently inside the visible viewport. Pins outside the view are still in
  // the results panel list — they just don't waste Leaflet marker DOM nodes.
  const displayedPins = (() => {
    if (!search.isResultsPanelOpen) return pins;
    const vp = viewportRef.current;
    if (!vp) return search.results;
    return search.results.filter(
      (p) =>
        p.latitude >= vp.south &&
        p.latitude <= vp.north &&
        p.longitude >= vp.west &&
        p.longitude <= vp.east
    );
  })();
  const displayedSummaries = search.isResultsPanelOpen ? [] : tileSummaries;

  // When a pin is selected from search: fly the map to it, then open the sidebar.
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
        pins={displayedPins}
        tileSummaries={displayedSummaries}
        mode={mode}
        basemap={basemap}
        pendingPin={pendingPin}
        draftPin={draftPin}
        flyToTarget={flyToTarget}
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
        onViewDetails={handleViewDetails}
        onModeChange={handleModeChange}
        onBasemapToggle={handleBasemapToggle}
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
