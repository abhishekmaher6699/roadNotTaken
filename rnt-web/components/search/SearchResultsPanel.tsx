"use client";

import { MapSidebarShell } from "@/components/map/sidebar/MapSidebarShell";
import { Pin } from "@/features/pins";
import { highlight } from "@/components/search/highlight";

interface SearchResultsPanelProps {
  open: boolean;
  query: string;
  results: Pin[];
  isSearching: boolean;
  onSelect: (pin: Pin) => void;
  onClose: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  general:      "#6b7280",
  food:         "#f59e0b",
  nature:       "#22c55e",
  history:      "#a78bfa",
  culture:      "#ec4899",
  architecture: "#3b82f6",
  viewpoint:    "#f97316",
};

function getCategoryColor(category?: string | null) {
  return CATEGORY_COLORS[category ?? ""] ?? "#6b7280";
}

export function SearchResultsPanel({
  open,
  query,
  results,
  isSearching,
  onSelect,
  onClose,
}: SearchResultsPanelProps) {
  return (
    <MapSidebarShell
      open={open}
      title="Search Results"
      description={query ? `Showing matches for "${query}"` : "Search to explore pins"}
      onClose={onClose}
      size="wide"
    >
      <div className="space-y-4 pb-4">
        {isSearching && results.length === 0 && (
          <div className="flex flex-col items-center justify-center space-y-3 py-10">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-800" />
            <p className="text-sm font-medium text-neutral-500">
              Searching the map...
            </p>
          </div>
        )}

        {!isSearching && results.length === 0 && query && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-lg font-semibold text-neutral-800">No places found</p>
            <p className="mt-1 text-sm text-neutral-500">
              We couldn't find anything matching &ldquo;{query}&rdquo;.
            </p>
          </div>
        )}

        {results.length > 0 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {results.map((pin) => (
              <button
                key={pin.id}
                type="button"
                onClick={() => onSelect(pin)}
                className="group relative flex flex-col items-start gap-3 rounded-2xl border border-neutral-200 bg-white p-4 text-left shadow-sm transition hover:border-neutral-300 hover:shadow-md"
              >
                <div className="flex w-full items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="truncate text-base font-semibold text-neutral-900 group-hover:text-neutral-950">
                      {highlight(pin.title, query).map((seg, idx) =>
                        seg.highlight ? (
                          <mark key={idx} className="bg-amber-100 font-bold text-neutral-950 rounded px-0.5">{seg.text}</mark>
                        ) : (
                          <span key={idx}>{seg.text}</span>
                        )
                      )}
                    </p>
                    {pin.address && (
                      <p className="mt-0.5 truncate text-sm text-neutral-500">
                        {highlight(pin.address, query).map((seg, idx) =>
                          seg.highlight ? (
                            <mark key={idx} className="bg-amber-50 font-semibold text-neutral-600 rounded px-0.5">{seg.text}</mark>
                          ) : (
                            <span key={idx}>{seg.text}</span>
                          )
                        )}
                      </p>
                    )}
                  </div>
                  
                  {pin.category && (
                    <span
                      className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white"
                      style={{ background: getCategoryColor(pin.category) }}
                    >
                      {pin.category}
                    </span>
                  )}
                </div>

                <div className="mt-auto flex w-full items-center gap-3 pt-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-500">
                    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                    {pin.score ?? 0}
                  </div>
                  
                  <div className="flex items-center gap-1 text-[11px] text-neutral-400">
                    <span>by {pin.posted_by || "anonymous"}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </MapSidebarShell>
  );
}
