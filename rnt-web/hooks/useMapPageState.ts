"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { usePins } from "@/features/pins/hooks";
import { useAuth } from "@/features/auth/hooks";
import type { CreatePinInput, Pin, UpdatePinInput } from "@/features/pins/types";
import type {
  BasemapMode,
  MapMode,
  MapSidebarView,
  MapViewport,
  PendingPin,
} from "@/types/mapTypes";
import { getVisibleMapTiles, getVisibleTiles, MIN_PIN_ZOOM } from "@/features/pins/tile-utils";

export function useMapPageState() {
  const { pins, tileSummaries, addPin, editPin, removePin, loadTiles, loadTileSummaries } = usePins();
  const { logout } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<MapMode>("view");
  const [basemap, setBasemap] = useState<BasemapMode>("standard");

  // Read the saved basemap preference safely after hydration.
  useEffect(() => {
    const saved = localStorage.getItem("rnt_basemap") as BasemapMode;
    if (saved === "standard" || saved === "imagery") {
      setBasemap(saved);
    }
  }, []);
  const [pendingPin, setPendingPin] = useState<PendingPin | null>(null);
  const [draftPin, setDraftPin] = useState<PendingPin | null>(null);
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);
  const [sidebarView, setSidebarView] = useState<MapSidebarView>(null);
  const [viewport, setViewport] = useState<MapViewport | null>(null);
  const viewportDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    setBasemap((current) => {
      const next = current === "standard" ? "imagery" : "standard";
      // Persist so the preference survives page reload.
      localStorage.setItem("rnt_basemap", next);
      return next;
    });
  };

  const handleViewportChange = (vp: MapViewport) => {
    if (viewportDebounceRef.current) {
      clearTimeout(viewportDebounceRef.current);
    }

    viewportDebounceRef.current = setTimeout(() => {
      setViewport(vp);

      if (vp.zoom < MIN_PIN_ZOOM) {
        void loadTileSummaries(getVisibleMapTiles(vp, vp.zoom));
        void loadTiles([], vp);
        return;
      }

      void loadTileSummaries([]);
      const visibleTiles = getVisibleTiles(vp, vp.zoom);
      void loadTiles(visibleTiles, vp);
    }, 120);
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

  const handleStartEditPin = () => {
    if (!selectedPin) {
      return;
    }

    setSidebarView("edit");
  };

  const handleUpdatePin = async (pinId: string, values: UpdatePinInput) => {
    const updatedPin = await editPin(pinId, values);
    setSelectedPin(updatedPin);
    setSidebarView("details");
    setMode("view");
  };

  const handleClearSelection = () => {
    if (sidebarView === "details" || sidebarView === "edit") {
      return;
    }

    setSelectedPin(null);
  };

  const handleCloseSidebar = () => {
    if (sidebarView === "details") {
      setSelectedPin(null);
    } else if (sidebarView === "edit") {
      setSidebarView("details");
      return;
    }
    setSidebarView(null);
    setDraftPin(null);
  };

  const handleViewDetails = () => {
    setSidebarView("details");
  };

  return {
    pins,
    tileSummaries,
    mode,
    basemap,
    pendingPin,
    draftPin,
    selectedPin,
    sidebarView,
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
    handleClearSelection,
    handleCloseSidebar,
    handleViewDetails,
  };
}
