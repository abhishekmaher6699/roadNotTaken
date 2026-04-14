"use client";

import type { ReactNode } from "react";

interface MapSidebarShellProps {
  open: boolean;
  title: string;
  description: string;
  onClose: () => void;
  children: ReactNode;
  size?: "default" | "wide";
}

export function MapSidebarShell({
  open,
  title,
  description,
  onClose,
  children,
  size = "default",
}: MapSidebarShellProps) {
  const widthClass =
    size === "wide"
      ? "w-[min(38rem,calc(100%-2rem))] xl:w-[min(42rem,calc(100%-2rem))]"
      : "w-[min(25rem,calc(100%-2rem))]";

  return (
    <div
      className={`map-sidebar-shell absolute left-4 top-20 z-2100 h-[calc(100%-6rem)] ${widthClass} rounded-3xl bg-white/97 shadow-2xl ring-1 ring-black/10 backdrop-blur transition duration-200 ${       
        open
          ? "translate-x-0 opacity-100"
          : "pointer-events-none -translate-x-6 opacity-0"
      }`}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-start justify-between border-b border-neutral-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-neutral-950">{title}</h2>
            <p className="mt-1 text-sm text-neutral-600">{description}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1 text-sm text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900"
          >
            Close
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
