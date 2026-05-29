import { redirect } from "next/navigation";
import { LoginPageClient } from "./login-page-client";
import { getServerAuthUser } from "@/lib/server-auth";
import { getServerProfile, isProfileComplete } from "@/lib/server-profile";

export default async function LoginPage() {
  const user = await getServerAuthUser();

  if (user) {
    const profile = await getServerProfile();
    if (isProfileComplete(profile)) {
      redirect("/map");
    }
  }

  return <LoginPageClient />;
}
