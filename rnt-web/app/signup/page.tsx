import { redirect } from "next/navigation";
import { SignupPageClient } from "./signup-page-client";
import { getServerAuthUser } from "@/lib/server-auth";

export default async function SignupPage() {
  const user = await getServerAuthUser();

  if (user) {
    redirect("/map");
  }

  return <SignupPageClient />;
}
