import { getCurrentUserApi } from "@/features/auth/api";

export function getOAuthHashParams() {
  if (typeof window === "undefined") {
    return new URLSearchParams();
  }

  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;

  return new URLSearchParams(hash);
}

export interface User {
  id: string;
  email?: string;
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const data = await getCurrentUserApi();
    return data.user ?? null;
  } catch (error) {
    console.error("Failed to get current user:", error);
    return null;
  }
}
