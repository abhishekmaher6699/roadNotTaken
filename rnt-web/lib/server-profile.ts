import { cookies } from "next/headers";
import type { Profile } from "@/features/profiles";
export { isProfileComplete } from "@/lib/profile-completion";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function getServerProfile() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (!accessToken) {
    return null;
  }

  try {
    const response = await fetch(`${API_URL}/profiles/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as Profile;
  } catch (error) {
    console.error("Failed to reach profile API from Next server:", error);
    throw new Error("Profile service is unavailable");
  }
}
