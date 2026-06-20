"use client";

import { useCallback, useEffect, useRef, useState, type SetStateAction } from "react";
import {
  getMyProfileApi,
  getProfileFollowListApi,
  getPublicProfileApi,
  updateMyProfileApi,
} from "./api";
import type {
  ProfileFollowListKind,
  ProfileFollowListUser,
  Profile,
  PublicProfileResponse,
  UpdateProfileInput,
} from "./types";

const FOLLOW_LIST_PAGE_LIMIT = 20;

export function usePublicProfile(userId: string | null) {
  const [profile, setProfile] = useState<PublicProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const loadProfile = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    if (!userId) {
      setProfile(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    setProfile(null);
    setIsLoading(true);
    setError(null);

    try {
      const nextProfile = await getPublicProfileApi(userId);
      if (requestIdRef.current !== requestId) return;
      setProfile(nextProfile);
      return nextProfile;
    } catch (err) {
      if (requestIdRef.current === requestId) {
        setProfile(null);
        setError(err instanceof Error ? err.message : "Failed to load profile");
      }
      throw err;
    } finally {
      if (requestIdRef.current === requestId) {
        setIsLoading(false);
      }
    }
  }, [userId]);

  useEffect(() => {
    void loadProfile().catch(() => undefined);
  }, [loadProfile]);

  const updateProfileState = useCallback(
    (updater: SetStateAction<PublicProfileResponse | null>) => {
      setProfile(updater);
    },
    [],
  );

  return { profile, isLoading, error, refetch: loadProfile, setProfile: updateProfileState };
}

export function useMyProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const nextProfile = await getMyProfileApi();
      setProfile(nextProfile);
      return nextProfile;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load profile";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (data: UpdateProfileInput) => {
    const nextProfile = await updateMyProfileApi(data);
    setProfile(nextProfile);
    return nextProfile;
  }, []);

  return { profile, isLoading, error, loadProfile, updateProfile };
}

export function useProfileFollowList(
  userId: string | null,
  kind: ProfileFollowListKind | null,
) {
  const [users, setUsers] = useState<ProfileFollowListUser[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const loadList = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    if (!userId || !kind) {
      setUsers([]);
      setNextCursor(null);
      setHasMore(false);
      setError(null);
      setIsLoading(false);
      return;
    }

    setUsers([]);
    setNextCursor(null);
    setHasMore(false);
    setIsLoading(true);
    setError(null);

    try {
      const page = await getProfileFollowListApi(userId, kind, {
        limit: FOLLOW_LIST_PAGE_LIMIT,
      });

      if (requestIdRef.current !== requestId) return;

      setUsers(page.users);
      setNextCursor(page.next_cursor);
      setHasMore(page.has_more);
      return page;
    } catch (err) {
      if (requestIdRef.current === requestId) {
        setUsers([]);
        setNextCursor(null);
        setHasMore(false);
        setError(err instanceof Error ? err.message : "Failed to load users");
      }
      throw err;
    } finally {
      if (requestIdRef.current === requestId) {
        setIsLoading(false);
      }
    }
  }, [kind, userId]);

  const loadMore = useCallback(async () => {
    if (!userId || !kind || !nextCursor || isLoadingMore) return;

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setIsLoadingMore(true);
    setError(null);

    try {
      const page = await getProfileFollowListApi(userId, kind, {
        cursor: nextCursor,
        limit: FOLLOW_LIST_PAGE_LIMIT,
      });

      if (requestIdRef.current !== requestId) return;

      setUsers((current) => {
        const seen = new Set(current.map((user) => user.user_id));
        const nextUsers = page.users.filter((user) => !seen.has(user.user_id));
        return [...current, ...nextUsers];
      });
      setNextCursor(page.next_cursor);
      setHasMore(page.has_more);
      return page;
    } catch (err) {
      if (requestIdRef.current === requestId) {
        setError(err instanceof Error ? err.message : "Failed to load more users");
      }
      throw err;
    } finally {
      if (requestIdRef.current === requestId) {
        setIsLoadingMore(false);
      }
    }
  }, [isLoadingMore, kind, nextCursor, userId]);

  useEffect(() => {
    void loadList().catch(() => undefined);
  }, [loadList]);

  return {
    users,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    refetch: loadList,
    loadMore,
  };
}
