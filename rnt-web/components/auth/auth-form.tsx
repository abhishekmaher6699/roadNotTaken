"use client";

import Link from "next/link";
import { useState } from "react";
import {
  loginSchema,
  signupSchema,
  type SignupFormValues,
} from "@/features/auth/validation";
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
  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
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
    <div className="flex min-h-screen items-center justify-center bg-neutral-100 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-md">
        <h1 className="mb-6 text-2xl font-semibold text-neutral-950">
          {props.title}
        </h1>

        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={isGoogleSubmitting || isSubmitting}
          className="mb-4 flex w-full items-center justify-center rounded-md border border-neutral-300 px-3 py-2 text-neutral-900 transition hover:border-neutral-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isGoogleSubmitting ? "Redirecting..." : props.googleLabel}
        </button>

        <div className="mb-4 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-neutral-400">
          <span className="h-px flex-1 bg-neutral-200" />
          <span>or</span>
          <span className="h-px flex-1 bg-neutral-200" />
        </div>

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="text-sm font-medium text-neutral-800"
            >
              Email
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
              className="w-full rounded-md border border-neutral-300 px-3 py-2 outline-none transition focus:border-neutral-900"
            />
            {errors.email && (
              <p id="email-error" className="text-sm text-red-600">
                {errors.email}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="text-sm font-medium text-neutral-800"
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
              className="w-full rounded-md border border-neutral-300 px-3 py-2 outline-none transition focus:border-neutral-900"
            />
            {errors.password && (
              <p id="password-error" className="text-sm text-red-600">
                {errors.password}
              </p>
            )}
          </div>

          {props.mode === "signup" && (
            <div className="space-y-1.5">
              <label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-neutral-800"
              >
                Confirm password
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
                className="w-full rounded-md border border-neutral-300 px-3 py-2 outline-none transition focus:border-neutral-900"
              />
              {errors.confirmPassword && (
                <p id="confirm-password-error" className="text-sm text-red-600">
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          )}

          {submitError && <p className="text-sm text-red-600">{submitError}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-neutral-950 px-3 py-2 text-white transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? props.pendingLabel : props.submitLabel}
          </button>
        </form>

        <p className="mt-4 text-sm text-neutral-600">
          {props.footerText}{" "}
          <Link
            href={props.footerHref}
            className="font-medium text-black underline"
          >
            {props.footerLinkLabel}
          </Link>
        </p>
      </div>
    </div>
  );
}
