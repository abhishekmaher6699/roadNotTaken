import { apiClient } from "@/lib/api-client";
import { AuthResponse, SignupResponse } from "./types";

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
