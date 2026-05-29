"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getMyProfileApi,
  getPublicProfileApi,
  updateMyProfileApi,
} from "./api";
import type {
  Profile,
  PublicProfileResponse,
  UpdateProfileInput,
} from "./types";

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

  return { profile, isLoading, error, refetch: loadProfile };
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
