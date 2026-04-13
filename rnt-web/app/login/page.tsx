import { redirect } from "next/navigation";
import { LoginPageClient } from "./login-page-client";
import { getServerAuthUser } from "@/lib/server-auth";

export default async function LoginPage() {
  const user = await getServerAuthUser();

  if (user) {
    redirect("/map");
  }

  return <LoginPageClient />;
}
