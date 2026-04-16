"use client";

import { useRouter } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { useAuth, type SignupFormValues } from "@/features/auth";

export function SignupPageClient() {
  const router = useRouter();
  const { signup, loginWithGoogle } = useAuth();

  const handleSignup = async ({ email, password }: SignupFormValues) => {
    await signup(email, password);
    router.replace("/map");
    router.refresh();
  };

  return (
    <AuthForm
      mode="signup"
      title="Create account"
      submitLabel="Sign up"
      pendingLabel="Creating account..."
      footerText="Already have an account?"
      footerHref="/login"
      footerLinkLabel="Login"
      googleLabel="Sign up with Google"
      onGoogleAuth={loginWithGoogle}
      onSubmit={handleSignup}
    />
  );
}
