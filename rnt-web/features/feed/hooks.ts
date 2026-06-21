"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getFeedApi } from "./api";
import type { ActivityEvent, FeedTab } from "./types";

interface FeedState {
  events: ActivityEvent[];
  nextCursor: string | null;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
}

const INITIAL_STATE: FeedState = {
  events: [],
  nextCursor: null,
  hasMore: false,
  isLoading: false,
  isLoadingMore: false,
  error: null,
};

export function useFeed(tab: FeedTab) {
  const [state, setState] = useState<FeedState>(INITIAL_STATE);
  const isFetchingRef = useRef(false);
  // Track which tab the current state belongs to so we can reset on switch.
  const activeTabRef = useRef<FeedTab>(tab);

  const load = useCallback(
    async (cursor?: string | null, append = false) => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      setState((prev) => ({
        ...prev,
        isLoading: !append,
        isLoadingMore: append,
        error: null,
      }));

      try {
        const page = await getFeedApi(tab, cursor);

        setState((prev) => ({
          events: append ? [...prev.events, ...page.events] : page.events,
          nextCursor: page.next_cursor,
          hasMore: page.has_more,
          isLoading: false,
          isLoadingMore: false,
          error: null,
        }));
      } catch (err: any) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isLoadingMore: false,
          error: err?.message ?? "Failed to load activity.",
        }));
      } finally {
        isFetchingRef.current = false;
      }
    },
    [tab],
  );

  // Reset + reload whenever the tab changes.
  useEffect(() => {
    if (activeTabRef.current !== tab) {
      activeTabRef.current = tab;
      setState(INITIAL_STATE);
    }
    void load(null, false);
  }, [tab, load]);

  const refresh = useCallback(() => {
    setState(INITIAL_STATE);
    void load(null, false);
  }, [load]);

  const loadMore = useCallback(() => {
    if (!state.hasMore || state.isLoadingMore) return;
    void load(state.nextCursor, true);
  }, [load, state.hasMore, state.isLoadingMore, state.nextCursor]);

  return {
    events: state.events,
    hasMore: state.hasMore,
    isLoading: state.isLoading,
    isLoadingMore: state.isLoadingMore,
    error: state.error,
    refresh,
    loadMore,
  };
}
