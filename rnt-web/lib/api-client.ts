const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function apiClient(
  endpoint: string,
  options: RequestInit = {}
) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "API Error");
  }

  return res.json();
}

export function getApiUrl(endpoint: string) {
  return `${API_URL}${endpoint}`;
}
