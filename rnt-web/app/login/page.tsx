"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { useAuth } from "@/features/auth/hooks";
import { isAuthenticated } from "@/lib/auth";
import { type LoginFormValues } from "@/features/auth/validation";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace("/map");
      return;
    }

    setIsReady(true);
  }, [router]);

  const handleLogin = async ({ email, password }: LoginFormValues) => {
    await login(email, password);
    router.replace("/map");
  };

  if (!isReady) {
    return null;
  }

  return (
    <AuthForm
      mode="login"
      title="Login"
      submitLabel="Login"
      pendingLabel="Logging in..."
      footerText="Don't have an account?"
      footerHref="/signup"
      footerLinkLabel="Sign up"
      onSubmit={handleLogin}
    />
  );
}
