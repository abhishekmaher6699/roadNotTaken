import { apiClient, getApiUrl } from "@/lib/api-client";
import {
  AuthResponse,
  AuthUser,
  CreateSessionInput,
  GoogleAuthUrlResponse,
  SignupResponse,
} from "./types";

type CurrentUserResponse = { user: AuthUser | null };

const CURRENT_USER_CACHE_TTL_MS = 30_000;

let currentUserCache:
  | {
      user: AuthUser | null;
      expiresAt: number;
    }
  | null = null;
let currentUserPromise: Promise<CurrentUserResponse> | null = null;

export function clearCurrentUserCache() {
  currentUserCache = null;
  currentUserPromise = null;
}

function setCurrentUserCache(user: AuthUser | null) {
  currentUserCache = {
    user,
    expiresAt: Date.now() + CURRENT_USER_CACHE_TTL_MS,
  };
}

export async function loginApi(email: string, password: string) {
  const response = (await apiClient("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })) as AuthResponse;

  setCurrentUserCache(response.user);
  return response;
}

export async function signupApi(email: string, password: string) {
  const response = (await apiClient("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })) as SignupResponse;

  setCurrentUserCache(response.user);
  return response;
}

export function getGoogleAuthUrlApi() {
  return apiClient("/auth/google/url") as Promise<GoogleAuthUrlResponse>;
}

export function getCurrentUserApi() {
  if (currentUserCache && currentUserCache.expiresAt > Date.now()) {
    return Promise.resolve({ user: currentUserCache.user });
  }

  if (currentUserPromise) {
    return currentUserPromise;
  }

  currentUserPromise = (apiClient("/auth/me") as Promise<CurrentUserResponse>)
    .then((response) => {
      setCurrentUserCache(response.user ?? null);
      return response;
    })
    .catch((error) => {
      clearCurrentUserCache();
      throw error;
    })
    .finally(() => {
      currentUserPromise = null;
    });

  return currentUserPromise;
}

export async function logoutApi() {
  const response = (await apiClient("/auth/logout", {
    method: "POST",
  })) as { message: string };

  clearCurrentUserCache();
  return response;
}

export async function createSessionApi(data: CreateSessionInput) {
  const response = (await apiClient("/auth/session", {
    method: "POST",
    body: JSON.stringify(data),
  })) as { message: string; user: AuthUser };

  setCurrentUserCache(response.user);
  return response;
}

export function getGoogleAuthStartUrl() {
  return getApiUrl("/auth/google/url");
}
