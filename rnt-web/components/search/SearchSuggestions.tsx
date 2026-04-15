"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Pin } from "@/features/pins/types";
import { highlight } from "@/components/search/highlight";

const CATEGORY_COLORS: Record<string, string> = {
  general: "#6b7280",
  food: "#f59e0b",
  nature: "#22c55e",
  history: "#a78bfa",
  culture: "#ec4899",
  architecture: "#3b82f6",
  viewpoint: "#f97316",
};

function getCategoryColor(category?: string | null) {
  return CATEGORY_COLORS[category ?? ""] ?? "#6b7280";
}

interface SearchSuggestionsProps {
  anchorRef: React.RefObject<HTMLDivElement | null>;
  suggestions: Pin[];
  isSearching: boolean;
  query: string;
  onSelect: (pin: Pin) => void;
  onDismiss: () => void;
}

export function SearchSuggestions({
  anchorRef,
  suggestions,
  isSearching,
  query,
  onSelect,
  onDismiss,
}: SearchSuggestionsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  // Track input position
  useEffect(() => {
    function updatePosition() {
      if (anchorRef.current) {
        setRect(anchorRef.current.getBoundingClientRect());
      }
    }

    updatePosition();

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [anchorRef]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node) &&
        !anchorRef.current?.contains(e.target as Node)
      ) {
        onDismiss();
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onDismiss, anchorRef]);

  if (!query.trim() || !rect) return null;

  return createPortal(
    <div
      ref={containerRef}
      className="pointer-events-auto rounded-2xl border border-white/20 bg-white/90 shadow-2xl backdrop-blur-xl z-[4000]"
      style={{
        position: "absolute",
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      }}
    >
      {isSearching && suggestions.length === 0 && (
        <div className="flex items-center gap-3 px-4 py-3.5">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-700" />
          <span className="text-sm text-neutral-500">Searching...</span>
        </div>
      )}

      {!isSearching && suggestions.length === 0 && (
        <div className="px-4 py-3.5 text-sm text-neutral-400">
          No pins found for &ldquo;{query}&rdquo;
        </div>
      )}

      {suggestions.map((pin, i) => (
        <button
          key={pin.id}
          type="button"
          onClick={() => onSelect(pin)}
          className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-neutral-50 ${
            i !== 0 ? "border-t border-neutral-100" : ""
          }`}
        >
          <span
            className="mt-0.5 h-2.5 w-2.5 flex-shrink-0 rounded-full"
            style={{ background: getCategoryColor(pin.category) }}
          />

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-neutral-900">
              {highlight(pin.title, query).map((seg, idx) =>
                seg.highlight ? (
                  <mark key={idx} className="bg-transparent font-bold text-neutral-950">{seg.text}</mark>
                ) : (
                  <span key={idx}>{seg.text}</span>
                )
              )}
            </p>
            {pin.address && (
              <p className="truncate text-xs text-neutral-400">
                {highlight(pin.address, query).map((seg, idx) =>
                  seg.highlight ? (
                    <mark key={idx} className="bg-transparent font-semibold text-neutral-600">{seg.text}</mark>
                  ) : (
                    <span key={idx}>{seg.text}</span>
                  )
                )}
              </p>
            )}
          </div>

          {pin.category && (
            <span
              className="flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
              style={{ background: getCategoryColor(pin.category) }}
            >
              {pin.category}
            </span>
          )}
        </button>
      ))}
    </div>,
    document.body,
  );
}
