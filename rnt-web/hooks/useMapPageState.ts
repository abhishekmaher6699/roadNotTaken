"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePins } from "@/features/pins/hooks";
import { useAuth } from "@/features/auth/hooks";
import type { CreatePinInput, Pin } from "@/features/pins/types";
import type {
  BasemapMode,
  MapMode,
  MapSidebarView,
  PendingPin,
} from "@/types/mapTypes";

export function useMapPageState() {
  const { pins, addPin, removePin } = usePins();
  const { logout } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<MapMode>("view");
  const [basemap, setBasemap] = useState<BasemapMode>("standard");
  const [pendingPin, setPendingPin] = useState<PendingPin | null>(null);
  const [draftPin, setDraftPin] = useState<PendingPin | null>(null);
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);
  const [sidebarView, setSidebarView] = useState<MapSidebarView>(null);

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
    if (pendingPin) {
      setDraftPin(pendingPin);
      setPendingPin(null);
      setSidebarView("create");
    }
  };

  const handleCancelPin = () => {
    setPendingPin(null);
    setSidebarView(null);
  };

  const handleModeChange = (nextMode: MapMode) => {
    setMode(nextMode);
    setPendingPin(null);
    setDraftPin(null);
    setSidebarView(null);

    if (nextMode === "edit") {
      setSelectedPin(null);
    }
  };

  const handleBasemapToggle = () => {
    setBasemap((current) =>
      current === "standard" ? "imagery" : "standard"
    );
  };

  const handleCreatePin = async (values: CreatePinInput) => {
    await addPin(values);
    setPendingPin(null);
    setDraftPin(null);
    setSidebarView(null);
    setMode("view");
  };

  const handleDeletePin = async (pinId: string) => {
    await removePin(pinId);
    setSelectedPin((current) => (current?.id === pinId ? null : current));
    setSidebarView(null);
  };

  const handleCloseSidebar = () => {
    setSidebarView(null);
    setDraftPin(null);
  };

  const handleViewDetails = () => {
    setSidebarView("details");
  };

  return {
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
    handleDeletePin,
    handleCloseSidebar,
    handleViewDetails,
  };
}
