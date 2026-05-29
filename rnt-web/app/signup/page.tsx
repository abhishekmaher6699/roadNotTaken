import { redirect } from "next/navigation";
import { SignupPageClient } from "./signup-page-client";
import { getServerAuthUser } from "@/lib/server-auth";
import { getServerProfile, isProfileComplete } from "@/lib/server-profile";

export default async function SignupPage() {
  const user = await getServerAuthUser();

  if (user) {
    const profile = await getServerProfile();
    if (isProfileComplete(profile)) {
      redirect("/map");
    }
  }

  return <SignupPageClient />;
}
