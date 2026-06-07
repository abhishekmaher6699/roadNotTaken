import { createAsyncCache } from "@/lib/async-cache";
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
const CURRENT_USER_CACHE_KEY = "current";
const currentUserCache = createAsyncCache<CurrentUserResponse>(
  CURRENT_USER_CACHE_TTL_MS,
);

export function clearCurrentUserCache() {
  currentUserCache.clear();
}

function setCurrentUserCache(user: AuthUser | null) {
  currentUserCache.set(CURRENT_USER_CACHE_KEY, { user });
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
  return currentUserCache.get(CURRENT_USER_CACHE_KEY, () =>
    (apiClient("/auth/me") as Promise<CurrentUserResponse>)
      .then((response) => {
        setCurrentUserCache(response.user ?? null);
        return response;
      })
      .catch((error) => {
        clearCurrentUserCache();
        throw error;
      }),
  );
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
