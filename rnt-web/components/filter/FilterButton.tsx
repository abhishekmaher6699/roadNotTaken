"use client";

import { useEffect, useRef, useState } from "react";
import {
  ACCESS_LEVEL_OPTIONS,
  CATEGORY_OPTIONS,
  STATUS_OPTIONS,
} from "../../features/filter/filterConstants";
import type { PinFilters } from "../../features/filter/types";

interface FilterButtonProps {
  filters: PinFilters;
  activeFilterCount: number;
  onToggleCategory: (value: string) => void;
  onToggleStatus: (value: string) => void;
  onToggleAccessLevel: (value: string) => void;
  onClear: () => void;
}

interface ChipGroupProps {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (value: string) => void;
}

function ChipGroup({ label, options, selected, onToggle }: ChipGroupProps) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onToggle(opt.value)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-all duration-150 ${
                active
                  ? "bg-neutral-900 text-white shadow-sm"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function FilterButton({
  filters,
  activeFilterCount,
  onToggleCategory,
  onToggleStatus,
  onToggleAccessLevel,
  onClear,
}: FilterButtonProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Filter pins"
        aria-expanded={open}
        className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium shadow-lg ring-1 backdrop-blur transition-colors duration-150 ${
          activeFilterCount > 0
            ? "bg-neutral-900 text-white ring-neutral-900"
            : "bg-white/95 text-neutral-500 ring-black/10 hover:bg-white hover:text-neutral-700"
        }`}
      >
        <svg
          className="h-4 w-4 shrink-0"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 0 1 .628.74v2.288a2.25 2.25 0 0 1-.659 1.59l-4.682 4.683a2.25 2.25 0 0 0-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 0 1 8 18.25v-5.757a2.25 2.25 0 0 0-.659-1.591L2.659 6.22A2.25 2.25 0 0 1 2 4.629V2.34a.75.75 0 0 1 .628-.74Z"
            clipRule="evenodd"
          />
        </svg>
        <span
          className={`absolute -right-1 -top-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
            activeFilterCount > 0
              ? "bg-neutral-900 text-white ring-2 ring-white"
              : "bg-transparent text-transparent"
          }`}
          aria-hidden={activeFilterCount === 0}
        >
          {activeFilterCount > 0 ? activeFilterCount : 0}
        </span>
      </button>

      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-full z-50 mt-2 w-[min(18rem,calc(100vw-1.5rem))] rounded-2xl bg-white/95 p-4 shadow-xl ring-1 ring-black/10 backdrop-blur sm:left-0 sm:right-auto sm:w-72"
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-neutral-800">Filter pins</p>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={onClear}
                className="text-xs font-medium text-neutral-400 transition hover:text-neutral-700"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="space-y-4">
            <ChipGroup
              label="Category"
              options={CATEGORY_OPTIONS}
              selected={filters.categories}
              onToggle={onToggleCategory}
            />
            <ChipGroup
              label="Status"
              options={STATUS_OPTIONS}
              selected={filters.statuses}
              onToggle={onToggleStatus}
            />
            <ChipGroup
              label="Access Level"
              options={ACCESS_LEVEL_OPTIONS}
              selected={filters.accessLevels}
              onToggle={onToggleAccessLevel}
            />
          </div>
        </div>
      )}
    </div>
  );
}
