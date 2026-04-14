"use client";

import dynamic from "next/dynamic";
import { MapOverlay } from "@/components/map/MapOverlay";
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
    selectedPin,
    setSelectedPin,
    handleLogout,
    handleAddPin,
    handleConfirmPin,
    handleCancelPin,
    handleModeChange,
    handleBasemapToggle,
  } = useMapPageState();

  return (
    <div className="relative h-screen overflow-hidden bg-neutral-100">
      <MapView
        pins={pins}
        mode={mode}
        basemap={basemap}
        pendingPin={pendingPin}
        selectedPin={selectedPin}
        onAddPin={handleAddPin}
        onSelectPin={setSelectedPin}
        onConfirmPin={handleConfirmPin}
        onCancelPin={handleCancelPin}
      />

      <MapOverlay
        user={user}
        mode={mode}
        basemap={basemap}
        selectedPin={selectedPin}
        onModeChange={handleModeChange}
        onBasemapToggle={handleBasemapToggle}
        onLogout={handleLogout}
      />
    </div>
  );
}
