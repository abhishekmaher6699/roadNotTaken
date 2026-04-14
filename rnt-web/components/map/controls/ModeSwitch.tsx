"use client";

import { MapMode } from "@/types/mapTypes";

interface ModeSwitchProps {
  mode: MapMode;
  onChange: (mode: MapMode) => void;
}

export function ModeSwitch({ mode, onChange }: ModeSwitchProps) {
  return (
    <div className="inline-flex rounded-full bg-white/95 p-1 shadow-lg ring-1 ring-black/10 backdrop-blur">
      <button
        type="button"
        onClick={() => onChange("view")}
        className={`rounded-full px-4 py-2 text-sm font-medium transition ${
          mode === "view"
            ? "bg-neutral-900 text-white"
            : "text-neutral-700 hover:bg-neutral-100"
        }`}
      >
        View
      </button>
      <button
        type="button"
        onClick={() => onChange("edit")}
        className={`rounded-full px-4 py-2 text-sm font-medium transition ${
          mode === "edit"
            ? "bg-neutral-900 text-white"
            : "text-neutral-700 hover:bg-neutral-100"
        }`}
      >
        Edit
      </button>
    </div>
  );
}
