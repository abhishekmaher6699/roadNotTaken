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
      ? "w-full sm:w-[min(38rem,calc(100%-2rem))] xl:w-[min(42rem,calc(100%-2rem))]"
      : "w-full sm:w-[min(25rem,calc(100%-2rem))]";

  return (
    <div
      className={`map-sidebar-shell absolute inset-x-0 bottom-0 top-auto z-[2100] h-[min(82vh,42rem)] ${widthClass} rounded-t-[1.75rem] bg-white shadow-xl ring-1 ring-black/8 transition-[transform,opacity] duration-150 ease-out will-change-transform sm:inset-x-auto sm:bottom-auto sm:left-4 sm:top-20 sm:h-[calc(100%-6rem)] sm:rounded-[1.75rem] ${
        open
          ? "translate-y-0 opacity-100 sm:translate-x-0"
          : "pointer-events-none translate-y-full opacity-0 sm:-translate-x-4 sm:translate-y-0"
      }`}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-start justify-between border-b border-neutral-200 px-4 py-3 sm:px-5">
          <div className="min-w-0">

            <h2 className="mt-1 text-base font-semibold text-neutral-950 sm:text-lg">
              {title}
            </h2>
            <p className="mt-1 text-xs leading-5 text-neutral-500 sm:text-sm">
              {description}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full border border-neutral-200 px-3 py-1 text-xs font-medium text-neutral-600 transition hover:bg-neutral-50 hover:text-neutral-900 sm:text-sm"
          >
            Close
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
          {children}
        </div>
      </div>
    </div>
  );
}
