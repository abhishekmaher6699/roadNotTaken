const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;

// Refresh logic (race-safe)
async function refreshToken(): Promise<void> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;

  refreshPromise = (async () => {
    try {
      console.log("Refreshing token...");

      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Refresh failed");
      }
    } catch (err) {
      console.error("Refresh failed:", err);

      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }

      throw err;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// MAIN CLIENT (SIMPLIFIED + CORRECT)
export async function apiClient(
  endpoint: string,
  options: RequestInit = {}
) {
  // 🔥 STEP 1: request
  let res = await fetch(`${API_URL}${endpoint}`, {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  // STEP 2: refresh on 401
  const shouldRefresh =
    res.status === 401 &&
    !endpoint.startsWith("/auth/login") &&
    !endpoint.startsWith("/auth/signup") &&
    !endpoint.startsWith("/auth/session") &&
    !endpoint.startsWith("/auth/refresh");

  if (shouldRefresh) {
    await refreshToken();

    res = await fetch(`${API_URL}${endpoint}`, {
      credentials: "include",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  }

  // STEP 3: handle errors
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "API Error");
  }

  return res.json();
}

// optional helper
export function getApiUrl(endpoint: string) {
  return `${API_URL}${endpoint}`;
}
