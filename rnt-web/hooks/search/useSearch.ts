"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type L from "leaflet";
import { Pin } from "@/features/pins/types";
import { searchPinsApi } from "@/features/pins/api";

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

// 🔥 Get real map center from Leaflet
function getCenter(map: L.Map | null) {
  if (!map) return undefined;

  const c = map.getCenter();
  return { lat: c.lat, lng: c.lng };
}

export function useSearch(
  mapRef: React.RefObject<L.Map | null>
): UseSearchReturn {
  const [query, setQueryState] = useState("");
  const [suggestions, setSuggestions] = useState<Pin[]>([]);
  const [results, setResults] = useState<Pin[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isResultsPanelOpen, setIsResultsPanelOpen] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Update query
  const setQuery = useCallback(
    (q: string) => {
      setQueryState(q);

      // Close results panel when user types again
      if (isResultsPanelOpen) {
        setIsResultsPanelOpen(false);
        setResults([]);
      }
    },
    [isResultsPanelOpen]
  );

  // 🔎 Suggestions (debounced)
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

        const center = getCenter(mapRef.current);

        const pins = await searchPinsApi(
          query,
          6,
          center,
          controller.signal
        );

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
  }, [query, mapRef]);

  // 🔍 Full search
  const search = useCallback(async () => {
    if (!query.trim() || query.trim().length < 2) return;

    if (abortRef.current) abortRef.current.abort();

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setIsSearching(true);

      // Show suggestions immediately (no flicker)
      if (suggestions.length > 0) {
        setResults(suggestions);
      }

      setIsResultsPanelOpen(true);

      const center = getCenter(mapRef.current);

      const pins = await searchPinsApi(
        query,
        100,
        center,
        controller.signal
      );

      setResults(pins);
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        console.error("Full search failed", err);
        setIsResultsPanelOpen(false);
      }
    } finally {
      setIsSearching(false);
    }
  }, [query, suggestions, mapRef]);

  // 🧹 Clear search
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