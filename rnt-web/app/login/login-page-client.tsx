"use client";

import { useRouter } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { useAuth, type LoginFormValues } from "@/features/auth";
import { getMyProfileApi } from "@/features/profiles";
import { isProfileComplete } from "@/lib/profile-completion";


export function LoginPageClient() {
  const router = useRouter();
  const { login, loginWithGoogle } = useAuth();

  const handleLogin = async ({ email, password }: LoginFormValues) => {
    await login(email, password);
    const profile = await getMyProfileApi();
    router.replace(isProfileComplete(profile) ? "/map" : "/profile/setup");
    router.refresh();
  };

  return (
    <AuthForm
      mode="login"
      title="Login"
      submitLabel="Login"
      pendingLabel="Logging in..."
      footerText="Don't have an account?"
      footerHref="/signup"
      footerLinkLabel="Sign up"
      googleLabel="Continue with Google"
      onGoogleAuth={loginWithGoogle}
      onSubmit={handleLogin}
    />
  );
}
