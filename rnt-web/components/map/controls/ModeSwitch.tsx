"use client";

import type { ModeSwitchProps } from "./types";

export function ModeSwitch({ mode, onChange }: ModeSwitchProps) {
  return (
    <div className="inline-flex rounded-full bg-white/95 p-1 shadow-lg ring-1 ring-black/10 backdrop-blur">
      <button
        type="button"
        onClick={() => onChange("view")}
        className={`rounded-full px-3 py-2 text-xs font-medium transition sm:px-4 sm:text-sm ${
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
        className={`rounded-full px-3 py-2 text-xs font-medium transition sm:px-4 sm:text-sm ${
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
