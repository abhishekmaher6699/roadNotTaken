import type { Profile } from "@/features/profiles";

export function isProfileComplete(
  profile: Pick<Profile, "username" | "display_name"> | null,
) {
  return Boolean(profile?.username?.trim() && profile?.display_name?.trim());
}
