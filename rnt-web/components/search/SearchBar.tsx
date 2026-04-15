"use client";

import { useRef, useEffect, KeyboardEvent } from "react";
import { Pin } from "@/features/pins/types";
import { SearchSuggestions } from "./SearchSuggestions";

interface SearchBarProps {
  query: string;
  suggestions: Pin[];
  isSearching: boolean;
  isResultsPanelOpen: boolean;
  onQueryChange: (q: string) => void;
  onSearch: () => void;
  onSelectPin: (pin: Pin) => void;
  onClear: () => void;
}

export function SearchBar({
  query,
  suggestions,
  isSearching,
  isResultsPanelOpen,
  onQueryChange,
  onSearch,
  onSelectPin,
  onClear,
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") onSearch();
    if (e.key === "Escape") onClear();
  }

  function handleSelect(pin: Pin) {
    onQueryChange(pin.title);
    onSelectPin(pin);
  }

  // Show dropdown only when user is actively typing, not when results panel took over.
  const showSuggestions = query.trim().length >= 2 && !isResultsPanelOpen;

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Pill */}
      <div className="flex items-center gap-2 rounded-full border border-white/25 bg-white/80 px-4 py-2.5 shadow-xl backdrop-blur-xl transition-all focus-within:border-white/50 focus-within:bg-white/95 focus-within:shadow-2xl">
        {/* Search icon */}
        <svg
          className="h-4 w-4 shrink-0 text-neutral-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z"
          />
        </svg>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search ruins, street art, hidden places..."
          className="min-w-0 flex-1 bg-transparent text-sm font-medium text-neutral-900 outline-none placeholder:text-neutral-400"
          aria-label="Search pins"
          autoComplete="off"
          spellCheck={false}
        />

        {/* Spinner while fetching */}
        {isSearching && (
          <div className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-600" />
        )}

        {/* Clear button */}
        {query && !isSearching && (
          <button
            type="button"
            onClick={onClear}
            aria-label="Clear search"
            className="shrink-0 rounded-full p-0.5 text-neutral-400 transition-colors hover:text-neutral-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Search button */}
        <button
          type="button"
          onClick={onSearch}
          aria-label="Run search"
          className="shrink-0 rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-neutral-700"
        >
          Search
        </button>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <SearchSuggestions
          anchorRef={containerRef}

          suggestions={suggestions}
          isSearching={isSearching}
          query={query}
          onSelect={handleSelect}
          onDismiss={() => onQueryChange("")}
        />
      )}
    </div>
  );
}
