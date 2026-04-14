"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePins } from "@/features/pins/hooks";
import { useAuth } from "@/features/auth/hooks";
import type { Pin } from "@/features/pins/types";
import type {
  BasemapMode,
  MapMode,
  PendingPin,
} from "@/types/mapTypes";

export function useMapPageState() {
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

  const handleAddPin = (latlng: PendingPin) => {
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

  const handleCancelPin = () => {
    setPendingPin(null);
  };

  const handleModeChange = (nextMode: MapMode) => {
    setMode(nextMode);
    setPendingPin(null);

    if (nextMode === "edit") {
      setSelectedPin(null);
    }
  };

  const handleBasemapToggle = () => {
    setBasemap((current) =>
      current === "standard" ? "imagery" : "standard"
    );
  };

  return {
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
  };
}
