"use client";

import { useState } from "react";

const LOCATION_KEY = "rnt_last_location";

export function saveLocation(lat: number, lng: number) {
  try {
    localStorage.setItem(LOCATION_KEY, JSON.stringify({ lat, lng }));
  } catch {}
}

export function loadLocation(): { lat: number; lng: number } | null {
  try {
    const raw = localStorage.getItem(LOCATION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

interface LocateButtonProps {
  onLocate: (lat: number, lng: number) => void;
}

export function LocateButton({ onLocate }: LocateButtonProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  function handleClick() {
    if (!navigator.geolocation) {
      setStatus("error");
      return;
    }

    setStatus("loading");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        saveLocation(latitude, longitude);
        onLocate(latitude, longitude);
        setStatus("idle");
      },
      () => setStatus("error"),
      { timeout: 8000, enableHighAccuracy: true }
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      title={
        status === "error"
          ? "Could not get location"
          : status === "loading"
            ? "Getting location..."
            : "Go to my location"
      }
      className={`relative flex h-11 w-11 items-center justify-center rounded-full border-2 shadow-lg transition hover:scale-[1.02] active:scale-95 sm:h-12 sm:w-12 ${
        status === "error"
          ? "border-red-300 bg-red-50 text-red-500"
          : "border-white bg-white text-neutral-700 hover:text-neutral-900"
      }`}
    >
      {status === "loading" ? (
        /* Spinner */
        <svg
          className="h-5 w-5 animate-spin text-neutral-500"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12" cy="12" r="10"
            stroke="currentColor" strokeWidth="2.5"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ) : status === "error" ? (
        /* Error X */
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
        </svg>
      ) : (
        /* Crosshair / location dot */
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
          <path strokeLinecap="round" d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          <circle cx="12" cy="12" r="8" />
        </svg>
      )}
    </button>
  );
}
