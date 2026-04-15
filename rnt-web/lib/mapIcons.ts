"use client";

import L from "leaflet";
import type { Pin } from "@/features/pins/types";

const shadowUrl =
  "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";

const iconCache = new Map<string, L.Icon>();

const categoryColorMap: Record<string, string> = {
  general: "#334155",
  food: "#f97316",
  nature: "#16a34a",
  history: "#b45309",
  culture: "#db2777",
  architecture: "#2563eb",
  viewpoint: "#7c3aed",
};

const previewPinColor = "#0f766e";

function buildMarkerIcon(color: string) {
  const key = color.toLowerCase();
  const cached = iconCache.get(key);

  if (cached) {
    return cached;
  }

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="42" viewBox="0 0 28 42" fill="none">
      <path d="M14 1C7.373 1 2 6.373 2 13c0 10.028 12 28 12 28s12-17.972 12-28C26 6.373 20.627 1 14 1Z" fill="${color}" stroke="#ffffff" stroke-width="1.5"/>
      <circle cx="14" cy="13" r="5" fill="#ffffff" fill-opacity="0.95"/>
    </svg>
  `.trim();

  const icon = L.icon({
    iconUrl: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    shadowUrl,
    iconSize: [28, 42],
    iconAnchor: [14, 42],
    popupAnchor: [0, -36],
    shadowSize: [41, 41],
    shadowAnchor: [13, 41],
  });

  iconCache.set(key, icon);

  return icon;
}

export function getPinIcon(category?: Pin["category"]) {
  const color = category ? categoryColorMap[category] : undefined;
  return buildMarkerIcon(color ?? categoryColorMap.general);
}

export function getPreviewPinIcon() {
  return buildMarkerIcon(previewPinColor);
}
