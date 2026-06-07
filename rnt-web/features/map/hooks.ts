"use client";

import { useRef, useSyncExternalStore, useState } from "react";
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
import { getVisibleSummaryTiles, getVisibleTiles, MIN_PIN_ZOOM } from "@/features/pins/tiles/tile-utils";

const BASEMAP_STORAGE_KEY = "rnt_basemap";
const BASEMAP_CHANGE_EVENT = "rnt:basemap-change";
const RAW_PIN_LAYER_ZOOM = MIN_PIN_ZOOM + 0.25;

function readStoredBasemap(): BasemapMode {
  if (typeof window === "undefined") {
    return "standard";
  }

  const saved = localStorage.getItem(BASEMAP_STORAGE_KEY);
  return saved === "imagery" ? "imagery" : "standard";
}

function subscribeToBasemap(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleChange = () => onStoreChange();

  window.addEventListener("storage", handleChange);
  window.addEventListener(BASEMAP_CHANGE_EVENT, handleChange);

  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener(BASEMAP_CHANGE_EVENT, handleChange);
  };
}

export function useMapPageState() {
  const {
    pins,
    tileSummaries,
    addPin,
    editPin,
    removePin,
    togglePinLike,
    togglePinVisit,
    updatePinCommentCount,
    setPinCommentCount,
    loadTiles,
    loadTileSummaries,
  } = usePins();
  const { logout } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<MapMode>("view");
  const basemap = useSyncExternalStore<BasemapMode>(
    subscribeToBasemap,
    readStoredBasemap,
    () => "standard",
  );

  const [pendingPin, setPendingPin] = useState<PendingPin | null>(null);
  const [draftPin, setDraftPin] = useState<PendingPin | null>(null);
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);
  const [sidebarView, setSidebarView] = useState<MapSidebarView>(null);
  const [profileSidebarUserId, setProfileSidebarUserId] = useState<string | null>(null);
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
    const next = basemap === "standard" ? "imagery" : "standard";
    localStorage.setItem(BASEMAP_STORAGE_KEY, next);
    window.dispatchEvent(new Event(BASEMAP_CHANGE_EVENT));
  };

  const handleViewportChange = (vp: MapViewport) => {
    if (viewportDebounceRef.current) {
      clearTimeout(viewportDebounceRef.current);
    }

    viewportDebounceRef.current = setTimeout(() => {
      setViewport(vp);

      if (vp.zoom < RAW_PIN_LAYER_ZOOM) {
        void loadTileSummaries(getVisibleSummaryTiles(vp, vp.zoom));
        void loadTiles([], vp);
        return;
      }

      void loadTileSummaries([]);
      const visibleTiles = getVisibleTiles(vp, vp.zoom);
      void loadTiles(visibleTiles, vp);
    }, 50);
  };

  const handleCreatePin = async (values: CreatePinInput) => {
    await addPin(values);
    setPendingPin(null);
    setDraftPin(null);
    setSidebarView(null);
    setMode("view");
  };

  const handleDeletePin = async (pinId: string) => {
    const deletedPin = selectedPin?.id === pinId ? selectedPin : undefined;
    await removePin(pinId, deletedPin);
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
    setSelectedPin((current) =>
      current && current.id === pinId
        ? {
            ...updatedPin,
            likes_count: current.likes_count,
            visits_count: current.visits_count,
            viewer_has_liked: current.viewer_has_liked,
            viewer_has_visited: current.viewer_has_visited,
          }
        : updatedPin,
    );
    setSidebarView("details");
    setMode("view");
  };

  const getOptimisticLikedPin = (pin: Pin): Pin => ({
    ...pin,
    viewer_has_liked: !pin.viewer_has_liked,
    likes_count: Math.max(
      pin.likes_count + (pin.viewer_has_liked ? -1 : 1),
      0,
    ),
  });

  const handleTogglePinLike = async (pin: Pin) => {
    let previousPin = pin;
    let optimisticPin = getOptimisticLikedPin(pin);

    setSelectedPin((current) => {
      if (!current || current.id !== pin.id) {
        return current;
      }

      previousPin = current;
      optimisticPin = getOptimisticLikedPin(current);
      return optimisticPin;
    });

    try {
      const updatedPin = await togglePinLike(pin.id, previousPin);

      if (!updatedPin) {
        return;
      }

      setSelectedPin((current) => {
        if (!current || current.id !== pin.id) {
          return current;
        }

        const stillOptimistic =
          current.viewer_has_liked === optimisticPin.viewer_has_liked &&
          current.likes_count === optimisticPin.likes_count;

        return stillOptimistic ? updatedPin : current;
      });
    } catch (error) {
      setSelectedPin((current) => {
        if (!current || current.id !== pin.id) {
          return current;
        }

        const stillOptimistic =
          current.viewer_has_liked === optimisticPin.viewer_has_liked &&
          current.likes_count === optimisticPin.likes_count;

        return stillOptimistic ? previousPin : current;
      });
      throw error;
    }
  };

  const getOptimisticVisitedPin = (pin: Pin): Pin => ({
    ...pin,
    viewer_has_visited: !pin.viewer_has_visited,
    visits_count: Math.max(
      pin.visits_count + (pin.viewer_has_visited ? -1 : 1),
      0,
    ),
  });

  const handleTogglePinVisit = async (pin: Pin) => {
    let previousPin = pin;
    let optimisticPin = getOptimisticVisitedPin(pin);

    setSelectedPin((current) => {
      if (!current || current.id !== pin.id) {
        return current;
      }

      previousPin = current;
      optimisticPin = getOptimisticVisitedPin(current);
      return optimisticPin;
    });

    try {
      const updatedPin = await togglePinVisit(pin.id, previousPin);

      if (!updatedPin) {
        return;
      }

      setSelectedPin((current) => {
        if (!current || current.id !== pin.id) {
          return current;
        }

        const stillOptimistic =
          current.viewer_has_visited === optimisticPin.viewer_has_visited &&
          current.visits_count === optimisticPin.visits_count;

        return stillOptimistic ? updatedPin : current;
      });
    } catch (error) {
      setSelectedPin((current) => {
        if (!current || current.id !== pin.id) {
          return current;
        }

        const stillOptimistic =
          current.viewer_has_visited === optimisticPin.viewer_has_visited &&
          current.visits_count === optimisticPin.visits_count;

        return stillOptimistic ? previousPin : current;
      });
      throw error;
    }
  };

  const handleCommentCountChange = (pinId: string, delta: number) => {
    updatePinCommentCount(pinId, delta);
    setSelectedPin((current) =>
      current && current.id === pinId
        ? {
            ...current,
            comment_count: Math.max(current.comment_count + delta, 0),
          }
        : current,
    );
  };

  const handleCommentCountSync = (pinId: string, count: number) => {
    setPinCommentCount(pinId, count);
    setSelectedPin((current) =>
      current && current.id === pinId
        ? {
            ...current,
            comment_count: Math.max(count, 0),
          }
        : current,
    );
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

  const handleOpenProfile = (userId: string) => {
    setProfileSidebarUserId(userId);
  };

  const handleCloseProfile = () => {
    setProfileSidebarUserId(null);
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
  };
}
