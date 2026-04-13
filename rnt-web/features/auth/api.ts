import { apiClient, getApiUrl } from "@/lib/api-client";
import {
  AuthResponse,
  CreateSessionInput,
  GoogleAuthUrlResponse,
  SignupResponse,
} from "./types";

export function loginApi(email: string, password: string) {
  return apiClient("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  }) as Promise<AuthResponse>;
}

export function signupApi(email: string, password: string) {
  return apiClient("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  }) as Promise<SignupResponse>;
}

export function getGoogleAuthUrlApi() {
  return apiClient("/auth/google/url") as Promise<GoogleAuthUrlResponse>;
}

export function getCurrentUserApi() {
  return apiClient("/auth/me") as Promise<{ user: { id: string; email?: string } }>;
}

export function logoutApi() {
  return apiClient("/auth/logout", {
    method: "POST",
  }) as Promise<{ message: string }>;
}

export function createSessionApi(data: CreateSessionInput) {
  return apiClient("/auth/session", {
    method: "POST",
    body: JSON.stringify(data),
  }) as Promise<{ message: string; user: { id: string; email?: string } }>;
}

export function getGoogleAuthStartUrl() {
  return getApiUrl("/auth/google/url");
}
