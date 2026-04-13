"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { useAuth } from "@/features/auth/hooks";
import { isAuthenticated } from "@/lib/auth";
import { type SignupFormValues } from "@/features/auth/validation";

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace("/map");
      return;
    }

    setIsReady(true);
  }, [router]);

  const handleSignup = async ({ email, password }: SignupFormValues) => {
    await signup(email, password);
    router.replace("/map");
  };

  if (!isReady) {
    return null;
  }

  return (
    <AuthForm
      mode="signup"
      title="Create account"
      submitLabel="Sign up"
      pendingLabel="Creating account..."
      footerText="Already have an account?"
      footerHref="/login"
      footerLinkLabel="Login"
      onSubmit={handleSignup}
    />
  );
}
