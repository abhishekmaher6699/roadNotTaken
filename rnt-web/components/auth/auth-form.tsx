"use client";

import Link from "next/link";
import { useState } from "react";
import {
  loginSchema,
  signupSchema,
  type SignupFormValues,
} from "@/features/auth";
import type { AuthFormProps, FieldErrors } from "./types";

// Converts Zod's field error arrays into the single-message shape the form renders.
function getErrorMap(error: {
  flatten: () => { fieldErrors: Record<string, string[]> };
}) {
  const { fieldErrors } = error.flatten();

  return Object.fromEntries(
    Object.entries(fieldErrors).map(([field, messages]) => [
      field,
      messages[0] ?? "",
    ])
  ) as FieldErrors;
}

export function AuthForm(props: AuthFormProps) {
  const [values, setValues] = useState<SignupFormValues>({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  const handleChange = (field: keyof SignupFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitError(null);
  };

  // Validates the active form mode before handing control back to the auth page.
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);

    if (props.mode === "signup") {
      const parsed = signupSchema.safeParse(values);

      if (!parsed.success) {
        setErrors(getErrorMap(parsed.error));
        return;
      }

      await runSubmit(() => props.onSubmit(parsed.data));
      return;
    }

    const parsed = loginSchema.safeParse({
      email: values.email,
      password: values.password,
    });

    if (!parsed.success) {
      setErrors(getErrorMap(parsed.error));
      return;
    }

    await runSubmit(() => props.onSubmit(parsed.data));
  };

  // Centralizes loading and API error handling for both login and signup submits.
  const runSubmit = async (action: () => Promise<void>) => {
    setErrors({});
    setIsSubmitting(true);

    try {
      await action();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Starts the Google OAuth redirect and surfaces any pre-redirect failure in the form.
  const handleGoogleAuth = async () => {
    setSubmitError(null);
    setIsGoogleSubmitting(true);

    try {
      await props.onGoogleAuth();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Something went wrong"
      );
      setIsGoogleSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#faf6ee] text-[#432e18] px-4 overflow-hidden selection:bg-[#dda15e]/30 selection:text-[#432e18]">
      {/* Decorative Scrapbook Elements */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(#432e18_1px,transparent_1px),linear-gradient(90deg,#432e18_1px,transparent_1px)] [background-size:40px_40px]" />
        
        {/* Floating leaf doodle */}
        <div className="absolute top-[15%] right-[10%] opacity-20 text-[#606c38] animate-sway">
          <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L12 12m0-9c4.97 0 9 4.03 9 9 0 2.12-.74 4.07-1.97 5.61L12 12" />
          </svg>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-md bg-[#fcf9f2] sketch-border sketch-shadow-lg rounded-3xl p-8">
        {/* Polaroid tape header */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-28 h-6 bg-[#dda15e]/60 -rotate-1 sketch-border border-dashed flex items-center justify-center text-[10px] font-bold text-[#432e18]/80 select-none">
          FIELD REGISTRY
        </div>

        {/* Brand Header */}
        <div className="text-center mb-8 mt-2">
          <Link href="/" className="inline-flex items-center gap-1.5 font-display font-black text-lg text-[#432e18] hover:scale-[1.01] transition-transform">
            <svg className="w-5 h-5 text-[#606c38]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <span>Road Not Taken</span>
          </Link>
          <h1 className="text-2xl font-black text-[#432e18] font-display mt-2">
            {props.title}
          </h1>
          <p className="text-xs text-[#432e18]/60 mt-1 font-medium">Record coordinates with a story.</p>
        </div>

        {/* Google Auth Button */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={isGoogleSubmitting || isSubmitting}
          className="flex w-full items-center justify-center gap-3 rounded-xl bg-white sketch-border sketch-shadow-sm sketch-btn-transition px-4 py-3 text-sm font-bold text-[#432e18] hover:bg-[#faf6ee] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isGoogleSubmitting ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-[#432e18]" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
          )}
          <span>{isGoogleSubmitting ? "Redirecting..." : props.googleLabel}</span>
        </button>

        <div className="my-6 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#432e18]/40">
          <span className="h-px flex-1 bg-[#432e18]/10" />
          <span>or</span>
          <span className="h-px flex-1 bg-[#432e18]/10" />
        </div>

        {/* Credentials Form */}
        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-xs font-bold text-[#432e18]/70 uppercase tracking-wider block"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={values.email}
              onChange={(event) => handleChange("email", event.target.value)}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "email-error" : undefined}
              className="w-full rounded-xl bg-[#faf6ee] sketch-border text-[#432e18] px-4 py-3 outline-none transition focus:bg-[#faf6ee]/60 focus:border-[#606c38] placeholder-[#432e18]/30 font-medium text-sm"
              placeholder="name@example.com"
            />
            {errors.email && (
              <p id="email-error" className="text-xs text-rose-600 mt-1.5 flex items-center gap-1 font-semibold">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {errors.email}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-xs font-bold text-[#432e18]/70 uppercase tracking-wider block"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete={
                props.mode === "signup" ? "new-password" : "current-password"
              }
              value={values.password}
              onChange={(event) => handleChange("password", event.target.value)}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "password-error" : undefined}
              className="w-full rounded-xl bg-[#faf6ee] sketch-border text-[#432e18] px-4 py-3 outline-none transition focus:bg-[#faf6ee]/60 focus:border-[#606c38] placeholder-[#432e18]/30 font-medium text-sm"
              placeholder="••••••••"
            />
            {errors.password && (
              <p id="password-error" className="text-xs text-rose-600 mt-1.5 flex items-center gap-1 font-semibold">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {errors.password}
              </p>
            )}
          </div>

          {props.mode === "signup" && (
            <div className="space-y-2">
              <label
                htmlFor="confirmPassword"
                className="text-xs font-bold text-[#432e18]/70 uppercase tracking-wider block"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={values.confirmPassword}
                onChange={(event) =>
                  handleChange("confirmPassword", event.target.value)
                }
                aria-invalid={Boolean(errors.confirmPassword)}
                aria-describedby={
                  errors.confirmPassword ? "confirm-password-error" : undefined
                }
                className="w-full rounded-xl bg-[#faf6ee] sketch-border text-[#432e18] px-4 py-3 outline-none transition focus:bg-[#faf6ee]/60 focus:border-[#606c38] placeholder-[#432e18]/30 font-medium text-sm"
                placeholder="••••••••"
              />
              {errors.confirmPassword && (
                <p id="confirm-password-error" className="text-xs text-rose-600 mt-1.5 flex items-center gap-1 font-semibold">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          )}

          {submitError && (
            <p className="text-xs text-rose-700 bg-rose-500/10 border-2 border-rose-600/30 px-3 py-2.5 rounded-xl flex items-center gap-2 font-semibold">
              <svg className="w-4 h-4 shrink-0 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{submitError}</span>
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-[#d97d64] text-white py-3.5 text-sm font-bold sketch-border sketch-shadow sketch-btn-transition hover:bg-[#c96c53] flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-100 border-t-white" />
            ) : null}
            <span>{isSubmitting ? props.pendingLabel : props.submitLabel}</span>
          </button>
        </form>

        <p className="mt-6 text-center text-xs font-semibold text-[#432e18]/60">
          {props.footerText}{" "}
          <Link
            href={props.footerHref}
            className="font-bold text-[#606c38] hover:underline underline-offset-4 decoration-[#606c38]/30 transition-colors"
          >
            {props.footerLinkLabel}
          </Link>
        </p>
      </div>
    </div>
  );
}
