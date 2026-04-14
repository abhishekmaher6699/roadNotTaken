"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePins } from "@/features/pins/hooks";
import { useAuth } from "@/features/auth/hooks";
import type {
  BasemapMode,
  MapMode,
  MapPageClientProps,
  PendingPin,
} from "@/types/mapTypes";
import type { Pin } from "@/features/pins/types";
import { ModeSwitch } from "@/components/map/controls/ModeSwitch";
import { BasemapToggle } from "@/components/map/controls/BasemapToggle";
import { UserMenu } from "@/components/map/controls/UserMenu";
import { PinInfoCard } from "@/components/map/controls/PinInfoCard";

const MapView = dynamic(() => import("@/components/map/mapView"), {
  ssr: false,
});

export function MapPageClient({ user }: MapPageClientProps) {
  const { pins, addPin } = usePins();
  const { logout } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<MapMode>("view");
  const [basemap, setBasemap] = useState<BasemapMode>("standard");
  const [pendingPin, setPendingPin] = useState<PendingPin | null>(null);
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
    router.refresh();
  };

  const handleAddPin = (latlng: { lat: number; lng: number }) => {
    if (mode !== "edit") {
      return;
    }

    setSelectedPin(null);
    setPendingPin(latlng);
  };

  const handleConfirmPin = async () => {
    if (!pendingPin) {
      return;
    }

    await addPin({
      title: "New Pin",
      latitude: pendingPin.lat,
      longitude: pendingPin.lng,
    });

    setPendingPin(null);
    setMode("view");
  };

  const handleModeChange = (nextMode: MapMode) => {
    setMode(nextMode);
    setPendingPin(null);

    if (nextMode === "edit") {
      setSelectedPin(null);
    }
  };

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
        onCancelPin={() => setPendingPin(null)}
      />

      <div className="pointer-events-none absolute inset-0 z-[2000]">
        <div className="pointer-events-auto absolute left-4 top-4">
          <ModeSwitch mode={mode} onChange={handleModeChange} />
        </div>

        <div className="pointer-events-auto absolute right-4 top-4 flex flex-col items-end gap-3">
          <UserMenu
            initial={(user.email?.[0] ?? "U").toUpperCase()}
            email={user.email}
            onLogout={handleLogout}
          />
          <BasemapToggle
            basemap={basemap}
            onToggle={() =>
              setBasemap((current) =>
                current === "standard" ? "imagery" : "standard"
              )
            }
          />
        </div>

        <div className="pointer-events-auto absolute bottom-4 left-4 w-[calc(100%-2rem)] max-w-sm">
          <PinInfoCard pin={selectedPin} mode={mode} />
        </div>
      </div>
    </div>
  );
}
