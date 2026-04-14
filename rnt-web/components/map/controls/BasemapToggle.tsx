"use client";

import { BasemapMode } from "@/types/mapTypes";

interface BasemapToggleProps {
  basemap: BasemapMode;
  onToggle: () => void;
}

export function BasemapToggle({ basemap, onToggle }: BasemapToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title={`Switch to ${basemap === "standard" ? "imagery" : "standard"} map`}
      className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-white bg-white shadow-lg transition hover:scale-[1.02] active:scale-95"
    >
      <div
        className={`h-full w-full ${
          basemap === "standard"
            ? "bg-[radial-gradient(circle_at_30%_30%,#d4d4d4,transparent_30%),linear-gradient(135deg,#dbeafe,#bfdbfe_40%,#c7d2fe)]"
            : "bg-[radial-gradient(circle_at_30%_30%,#fef3c7,transparent_28%),linear-gradient(135deg,#0f172a,#1d4ed8_45%,#16a34a)]"
        }`}
      />
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
        {basemap === "standard" ? "Map" : "Sat"}
      </div>
    </button>
  );
}
