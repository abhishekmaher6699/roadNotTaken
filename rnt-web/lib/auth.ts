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

type CurrentUserResponse = User | { user?: User | null };

function isUser(value: CurrentUserResponse): value is User {
  return "id" in value;
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/auth/me`, {
      credentials: "include",
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as CurrentUserResponse;

    if ("user" in data) {
      return data.user ?? null;
    }

    return isUser(data) ? data : null;
  } catch (error) {
    console.error("Failed to get current user:", error);
    return null;
  }
}
