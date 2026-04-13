"use client";

import { useRouter } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { useAuth } from "@/features/auth/hooks";
import { type LoginFormValues } from "@/features/auth/validation";

export function LoginPageClient() {
  const router = useRouter();
  const { login, loginWithGoogle } = useAuth();

  const handleLogin = async ({ email, password }: LoginFormValues) => {
    await login(email, password);
    router.replace("/map");
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
