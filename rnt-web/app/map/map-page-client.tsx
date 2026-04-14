"use client";

import dynamic from "next/dynamic";
import { MapOverlay } from "@/components/map/MapOverlay";
import { CreatePinSidebar } from "@/components/map/sidebar/create-pin";
import { EditPinSidebar } from "@/components/map/sidebar/edit-pin";
import { PinDetailsSidebar } from "@/components/map/sidebar/pin-details";
import { useMapPageState } from "@/hooks/useMapPageState";
import type { MapPageClientProps } from "@/types/mapTypes";

const MapView = dynamic(() => import("@/components/map/mapView"), {
  ssr: false,
});

export function MapPageClient({ user }: MapPageClientProps) {
  const {
    pins,
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
    handleCreatePin,
    handleStartEditPin,
    handleUpdatePin,
    handleDeletePin,
    handleClearSelection,
    handleCloseSidebar,
    handleViewDetails,
  } = useMapPageState();

  return (
    <div className="relative h-screen overflow-hidden bg-neutral-100">
      <MapView
        pins={pins}
        mode={mode}
        basemap={basemap}
        pendingPin={pendingPin}
        draftPin={draftPin}
        onAddPin={handleAddPin}
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
    </div>
  );
}
