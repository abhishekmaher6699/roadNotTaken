"use client";

import { useEffect, useRef, useState } from "react";
import type L from "leaflet";
import dynamic from "next/dynamic";

import { MapOverlay } from "@/components/map/MapOverlay";
import { CreatePinSidebar } from "@/components/map/sidebar/create-pin";
import { EditPinSidebar } from "@/components/map/sidebar/edit-pin";
import { PinDetailsSidebar } from "@/components/map/sidebar/pin-details";
import { ProfileSidebar } from "@/components/map/sidebar/profile";
import { SearchResultsPanel } from "@/components/search";
import { useMapPageState } from "@/features/map/hooks";
import { useSearch } from "@/features/search";
import { getPinApi } from "@/features/pins/api";
import { useDisplayedPins, type Pin } from "@/features/pins";
import { usePinFilters } from "@/features/filter";
import { getMyProfileApi } from "@/features/profiles";
import type { ProfileSearchResult } from "@/features/profiles";
import { loadLocation } from "@/components/map/controls";
import type { MapPageClientProps } from "@/types/mapTypes";

const MapView = dynamic(() => import("@/components/map/mapView"), {
  ssr: false,
});

const DEFAULT_CENTER: [number, number] = [18.52, 73.85];
const DEFAULT_ZOOM = 14;
const MAP_VIEW_STORAGE_KEY = "rnt_last_map_view";

function getInitialMapView(): { center: [number, number]; zoom: number } {
  try {
    const raw = localStorage.getItem(MAP_VIEW_STORAGE_KEY);
    const saved = raw ? JSON.parse(raw) : null;
    const lat = Number(saved?.lat);
    const lng = Number(saved?.lng);
    const zoom = Number(saved?.zoom);

    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return {
        center: [lat, lng],
        zoom: Number.isFinite(zoom) ? zoom : DEFAULT_ZOOM,
      };
    }
  } catch {}

  const saved = loadLocation();
  return {
    center: saved ? [saved.lat, saved.lng] : DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM,
  };
}

export function MapPageClient({ user }: MapPageClientProps) {
  const [{ center: initialCenter, zoom: initialZoom }] =
    useState(getInitialMapView);
  const mapRef = useRef<L.Map | null>(null);
  const [flyToTarget, setFlyToTarget] = useState<{ lat: number; lng: number } | null>(null);
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(null);
  const [focusedCommentId, setFocusedCommentId] = useState<number | null>(null);

  const {
    pins,
    tileSummaries,
    mode,
    basemap,
    pendingPin,
    draftPin,
    selectedPin,
    sidebarView,
    profileSidebarUserId,
    viewport,
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
    handleTogglePinLike,
    handleTogglePinVisit,
    handleCommentCountChange,
    handleCommentCountSync,
    handleClearSelection,
    handleCloseSidebar,
    handleViewDetails,
    handleOpenProfile,
    handleCloseProfile,
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
    toggleVisitedOnly,
  } = usePinFilters();

  const filteredPins = isFiltersActive ? applyFilters(pins) : pins;

  const displayedPins = useDisplayedPins(
    filteredPins,
    search.results,
    search.isResultsPanelOpen,
    viewport,
  );
  const displayedSummaries = search.isResultsPanelOpen ? [] : tileSummaries;

  useEffect(() => {
    getMyProfileApi()
      .then((profile) => setProfileAvatarUrl(profile.avatar_url))
      .catch(() => setProfileAvatarUrl(null));
  }, []);

  useEffect(() => {
    if (!focusedCommentId) return;

    const timeout = window.setTimeout(() => {
      setFocusedCommentId(null);
    }, 2500);

    return () => window.clearTimeout(timeout);
  }, [focusedCommentId]);

  function handleLocate(lat: number, lng: number) {
    setFlyToTarget({ lat, lng });
  }

  function handleSearchSelectPin(pin: Pin | null) {
    if (!pin) return;
    setFlyToTarget({ lat: pin.latitude, lng: pin.longitude });
    setSelectedPin(pin);
    setFocusedCommentId(null);
    handleViewDetails();
    search.clear();
  }

  function handleSearchSelectUser(profile: ProfileSearchResult) {
    handleOpenProfile(profile.user_id);
    search.clear();
  }

  async function handleOpenProfilePin(pinId: string, commentId?: number) {
    const pin =
      pins.find((candidate) => String(candidate.id) === String(pinId)) ??
      (await getPinApi(pinId));

    setFlyToTarget({ lat: pin.latitude, lng: pin.longitude });
    setSelectedPin(pin);
    setFocusedCommentId(commentId ?? null);
    handleViewDetails();
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
        initialZoom={initialZoom}
        onAddPin={handleAddPin}
        onViewportChange={handleViewportChange}
        onSelectPin={setSelectedPin}
        onClearSelection={handleClearSelection}
        onConfirmPin={handleConfirmPin}
        onCancelPin={handleCancelPin}
      />

      <MapOverlay
        user={user}
        mode={mode}
        basemap={basemap}
        profileAvatarUrl={profileAvatarUrl}
        selectedPin={selectedPin}
        search={{
          query: search.query,
          suggestions: search.suggestions,
          userSuggestions: search.userSuggestions,
          isSearching: search.isSearching,
          isResultsPanelOpen: search.isResultsPanelOpen,
          setQuery: search.setQuery,
          search: search.search,
          clear: search.clear,
          onSelectPin: handleSearchSelectPin,
          onSelectUser: handleSearchSelectUser,
        }}
        filter={{
          filters,
          activeFilterCount,
          onToggleCategory: toggleCategory,
          onToggleStatus: toggleStatus,
          onToggleAccessLevel: toggleAccessLevel,
          onToggleVisitedOnly: toggleVisitedOnly,
          onClearFilters: clearFilters,
        }}
        onViewDetails={handleViewDetails}
        onModeChange={handleModeChange}
        onBasemapToggle={handleBasemapToggle}
        onLocate={handleLocate}
        onOpenProfile={() => handleOpenProfile(user.id)}
        onOpenProfileById={handleOpenProfile}
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
        onToggleLike={handleTogglePinLike}
        onToggleVisit={handleTogglePinVisit}
        onOpenProfile={handleOpenProfile}
        focusedCommentId={focusedCommentId}
        onCommentCountChange={handleCommentCountChange}
        onCommentCountSync={handleCommentCountSync}
      />

      <ProfileSidebar
        open={Boolean(profileSidebarUserId)}
        userId={profileSidebarUserId}
        currentUserId={user.id}
        fallbackEmail={user.email}
        canEdit={profileSidebarUserId === user.id}
        onOpenPin={handleOpenProfilePin}
        onOpenProfile={handleOpenProfile}
        onProfileSaved={setProfileAvatarUrl}
        onClose={handleCloseProfile}
      />

      <SearchResultsPanel
        open={search.isResultsPanelOpen}
        query={search.query}
        results={search.results}
        userResults={search.userResults}
        isSearching={search.isSearching}
        onSelect={handleSearchSelectPin}
        onSelectUser={handleSearchSelectUser}
        onClose={search.clear}
      />
    </div>
  );
}
