"use client";

import { useCallback, useEffect, useState } from "react";
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

  useEffect(() => {
    let ignore = false;

    async function loadProfile() {
      if (!userId) {
        setProfile(null);
        setError(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const nextProfile = await getPublicProfileApi(userId);
        if (!ignore) setProfile(nextProfile);
      } catch (err) {
        if (!ignore) {
          setProfile(null);
          setError(err instanceof Error ? err.message : "Failed to load profile");
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    void loadProfile();

    return () => {
      ignore = true;
    };
  }, [userId]);

  return { profile, isLoading, error };
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
