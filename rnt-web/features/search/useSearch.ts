"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Pin } from "@/features/pins/types";
import { searchPinsApi } from "@/features/pins/api";
import type { MapViewport } from "@/types/mapTypes";

export interface UseSearchReturn {
  query: string;
  setQuery: (q: string) => void;
  suggestions: Pin[];
  results: Pin[];
  isSearching: boolean;
  isResultsPanelOpen: boolean;
  search: () => void;
  clear: () => void;
}

// viewportRef is passed as a ref so changing the viewport doesn't re-render this hook.
export function useSearch(viewportRef: React.RefObject<MapViewport | null>): UseSearchReturn {
  const [query, setQueryState] = useState("");
  const [suggestions, setSuggestions] = useState<Pin[]>([]);
  const [results, setResults] = useState<Pin[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isResultsPanelOpen, setIsResultsPanelOpen] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setQuery = useCallback((q: string) => {
    setQueryState(q);
    if (isResultsPanelOpen) {
      setIsResultsPanelOpen(false);
      setResults([]);
    }
  }, [isResultsPanelOpen]);

  // Debounced suggestion fetch — fires 300ms after the user stops typing.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();

    if (!query.trim() || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        setIsSearching(true);
        const pins = await searchPinsApi(query, 6, viewportRef.current, controller.signal);
        setSuggestions(pins);
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          console.error("Search suggestions failed", err);
          setSuggestions([]);
        }
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, viewportRef]);

  // Full search — fetches up to 100 results with viewport proximity boost.
  const search = useCallback(async () => {
    if (!query.trim() || query.trim().length < 2) return;
    if (abortRef.current) abortRef.current.abort();

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setIsSearching(true);

      // Show suggestions immediately while full results load (no flicker).
      if (suggestions.length > 0) {
        setResults(suggestions);
      }

      setIsResultsPanelOpen(true);
      const pins = await searchPinsApi(query, 100, viewportRef.current, controller.signal);
      setResults(pins);
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        console.error("Full search failed", err);
        setIsResultsPanelOpen(false);
      }
    } finally {
      setIsSearching(false);
    }
  }, [query, suggestions, viewportRef]);

  const clear = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setQueryState("");
    setSuggestions([]);
    setResults([]);
    setIsResultsPanelOpen(false);
    setIsSearching(false);
  }, []);

  return {
    query,
    setQuery,
    suggestions,
    results,
    isSearching,
    isResultsPanelOpen,
    search,
    clear,
  };
}
