import { redirect } from "next/navigation";
import { ProfileSetupClient } from "./profile-setup-client";
import { getServerAuthUser } from "@/lib/server-auth";
import { getServerProfile, isProfileComplete } from "@/lib/server-profile";

export default async function ProfileSetupPage() {
  const user = await getServerAuthUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getServerProfile();

  if (isProfileComplete(profile)) {
    redirect("/map");
  }

  return <ProfileSetupClient email={user.email} />;
}
