"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type L from "leaflet";
import { Pin } from "@/features/pins/types";
import { searchPinsApi } from "@/features/pins/api";
import { searchProfilesApi } from "@/features/profiles/api";
import type { ProfileSearchResult } from "@/features/profiles";

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}

export interface UseSearchReturn {
  query: string;
  setQuery: (q: string) => void;
  suggestions: Pin[];
  userSuggestions: ProfileSearchResult[];
  results: Pin[];
  userResults: ProfileSearchResult[];
  isSearching: boolean;
  isResultsPanelOpen: boolean;
  search: () => void;
  clear: () => void;
}

// Get real map center from Leaflet
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
  const [userSuggestions, setUserSuggestions] = useState<ProfileSearchResult[]>([]);
  const [results, setResults] = useState<Pin[]>([]);
  const [userResults, setUserResults] = useState<ProfileSearchResult[]>([]);
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
        setUserResults([]);
      }
    },
    [isResultsPanelOpen]
  );

  //  Suggestions (debounced)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();

    if (!query.trim() || query.trim().length < 2) {
      setSuggestions([]);
      setUserSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        setIsSearching(true);

        const center = getCenter(mapRef.current);

        const [pins, users] = await Promise.all([
          searchPinsApi(query, 6, center, controller.signal),
          searchProfilesApi(query, 6, controller.signal),
        ]);

        setSuggestions(pins);
        setUserSuggestions(users);
      } catch (error: unknown) {
        if (!isAbortError(error)) {
          console.error("Search suggestions failed", error);
          setSuggestions([]);
          setUserSuggestions([]);
        }
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, mapRef]);

  // Full search
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
      if (userSuggestions.length > 0) {
        setUserResults(userSuggestions);
      }

      setIsResultsPanelOpen(true);

      const center = getCenter(mapRef.current);

      const [pins, users] = await Promise.all([
        searchPinsApi(query, 100, center, controller.signal),
        searchProfilesApi(query, 50, controller.signal),
      ]);

      setResults(pins);
      setUserResults(users);
    } catch (error: unknown) {
      if (!isAbortError(error)) {
        console.error("Full search failed", error);
        setIsResultsPanelOpen(false);
      }
    } finally {
      setIsSearching(false);
    }
  }, [query, suggestions, userSuggestions, mapRef]);

  //  Clear search
  const clear = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    if (debounceRef.current) clearTimeout(debounceRef.current);

    setQueryState("");
    setSuggestions([]);
    setUserSuggestions([]);
    setResults([]);
    setUserResults([]);
    setIsResultsPanelOpen(false);
    setIsSearching(false);
  }, []);

  return {
    query,
    setQuery,
    suggestions,
    userSuggestions,
    results,
    userResults,
    isSearching,
    isResultsPanelOpen,
    search,
    clear,
  };
}
