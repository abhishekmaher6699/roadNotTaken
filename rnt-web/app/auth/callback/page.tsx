"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { completeGoogleOAuth } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const finishOAuth = useEffectEvent(async () => {
    try {
      await completeGoogleOAuth();
      router.replace("/map");
      router.refresh();
    } catch (oauthError) {
      setError(
        oauthError instanceof Error ? oauthError.message : "Google sign-in failed"
      );
    }
  });

  useEffect(() => {
    void finishOAuth();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-100 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-md">
        <h1 className="text-xl font-semibold text-neutral-950">
          Completing sign in
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          {error ?? "Please wait while we finish your Google login."}
        </p>
      </div>
    </div>
  );
}
