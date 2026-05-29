"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Pin } from "@/features/pins/types";
import type { ProfileSearchResult } from "@/features/profiles";
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
  userSuggestions: ProfileSearchResult[];
  isSearching: boolean;
  query: string;
  onSelect: (pin: Pin) => void;
  onSelectUser: (user: ProfileSearchResult) => void;
  onDismiss: () => void;
}

export function SearchSuggestions({
  anchorRef,
  suggestions,
  userSuggestions,
  isSearching,
  query,
  onSelect,
  onSelectUser,
  onDismiss,
}: SearchSuggestionsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [pinsOpen, setPinsOpen] = useState(true);
  const [usersOpen, setUsersOpen] = useState(true);

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
      className="pointer-events-auto rounded-2xl border border-white/20 bg-white/90 shadow-2xl backdrop-blur-xl z-4000"
      style={{
        position: "absolute",
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      }}
    >
      {isSearching && suggestions.length === 0 && userSuggestions.length === 0 && (
        <div className="flex items-center gap-3 px-4 py-3.5">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-700" />
          <span className="text-sm text-neutral-500">Searching...</span>
        </div>
      )}

      {!isSearching && suggestions.length === 0 && userSuggestions.length === 0 && (
        <div className="px-4 py-3.5 text-sm text-neutral-400">
          No pins or users found for &ldquo;{query}&rdquo;
        </div>
      )}

      {suggestions.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setPinsOpen((value) => !value)}
            className="flex w-full items-center justify-between border-b border-neutral-100 px-4 py-2 text-left hover:bg-neutral-50"
          >
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
              Pins
            </span>
            <span className="text-xs font-semibold text-neutral-400">
              {suggestions.length}
            </span>
          </button>
          {pinsOpen && suggestions.map((pin) => (
            <button
              key={pin.id}
              type="button"
              onClick={() => onSelect(pin)}
              className="flex w-full items-center gap-3 border-b border-neutral-100 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-neutral-50"
            >
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
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 text-[10px] font-semibold capitalize text-neutral-500">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: getCategoryColor(pin.category) }}
                  />
                  {pin.category}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {userSuggestions.length > 0 && (
        <div className={suggestions.length > 0 ? "border-t border-neutral-100" : ""}>
          <button
            type="button"
            onClick={() => setUsersOpen((value) => !value)}
            className="flex w-full items-center justify-between border-b border-neutral-100 px-4 py-2 text-left hover:bg-neutral-50"
          >
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
              Users
            </span>
            <span className="text-xs font-semibold text-neutral-400">
              {userSuggestions.length}
            </span>
          </button>
          {usersOpen && userSuggestions.map((user) => {
            const name = user.display_name || user.username || "Anonymous";
            return (
              <button
                key={user.user_id}
                type="button"
                onClick={() => onSelectUser(user)}
                className="flex w-full items-center gap-3 border-b border-neutral-100 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-neutral-50"
              >
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt=""
                    className="h-8 w-8 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-xs font-semibold text-white">
                    {name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-neutral-900">
                    {highlight(name, query).map((seg, idx) =>
                      seg.highlight ? (
                        <mark key={idx} className="bg-transparent font-bold text-neutral-950">{seg.text}</mark>
                      ) : (
                        <span key={idx}>{seg.text}</span>
                      )
                    )}
                  </p>
                  <p className="truncate text-xs text-neutral-400">
                    {user.username ? `@${user.username}` : "Road Not Taken member"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>,
    document.body,
  );
}
