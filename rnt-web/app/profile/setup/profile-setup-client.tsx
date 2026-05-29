"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMyProfileApi, updateMyProfileApi } from "@/features/profiles";
import { useCloudinaryUpload } from "@/features/uploads/hooks";

interface ProfileSetupClientProps {
  email?: string;
}

interface ProfileSetupForm {
  display_name: string;
  username: string;
  bio: string;
  location: string;
  avatar_url: string;
}

function getInitial(value: string) {
  return value.trim().charAt(0).toUpperCase() || "U";
}

function getEmailFallback(email?: string) {
  const localPart = email?.split("@")[0] ?? "";
  return localPart.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32);
}

export function ProfileSetupClient({ email }: ProfileSetupClientProps) {
  const router = useRouter();
  const { uploadImage } = useCloudinaryUpload();
  const fallback = getEmailFallback(email);
  const [form, setForm] = useState<ProfileSetupForm>({
    display_name: fallback,
    username: fallback.toLowerCase(),
    bio: "",
    location: "",
    avatar_url: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    let active = true;

    getMyProfileApi()
      .then((profile) => {
        if (!active) return;

        setForm({
          display_name: profile.display_name ?? fallback,
          username: profile.username ?? fallback.toLowerCase(),
          bio: profile.bio ?? "",
          location: profile.location ?? "",
          avatar_url: profile.avatar_url ?? "",
        });
      })
      .catch((loadError) => {
        if (!active) return;
        setError(
          loadError instanceof Error ? loadError.message : "Failed to load profile",
        );
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [fallback]);

  const updateField = (field: keyof ProfileSetupForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError(null);
  };

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      setIsUploading(true);
      const url = await uploadImage(file, "profiles");
      setForm((current) => ({ ...current, avatar_url: url }));
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "Avatar upload failed",
      );
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const username = form.username.trim().toLowerCase();
    const displayName = form.display_name.trim();

    if (!displayName) {
      setError("Display name is required");
      return;
    }

    if (!/^[a-z0-9_-]{3,32}$/.test(username)) {
      setError("Username must be 3-32 characters using letters, numbers, _ or -");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      await updateMyProfileApi({
        display_name: displayName,
        username,
        bio: form.bio,
        location: form.location,
        avatar_url: form.avatar_url,
      });
      router.replace("/map");
      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Failed to save profile",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-100 px-4 py-6 text-neutral-950 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-48px)] w-full max-w-5xl items-center">
        <div className="grid w-full grid-cols-1 overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/5 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="relative min-h-72 overflow-hidden bg-[#121712] p-6 text-white sm:p-8">
            <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(90deg,rgba(255,255,255,0.09)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.09)_1px,transparent_1px)] [background-size:56px_56px]" />
            <div className="absolute left-12 top-20 h-2.5 w-2.5 rounded-full bg-emerald-300 shadow-[0_0_0_12px_rgba(110,231,183,0.18)]" />
            <div className="absolute bottom-20 right-14 h-2.5 w-2.5 rounded-full bg-rose-300 shadow-[0_0_0_12px_rgba(253,164,175,0.18)]" />
            <div className="absolute left-[-20%] top-[54%] h-px w-[140%] rotate-[-16deg] bg-white/18" />
            <div className="relative z-10 flex h-full flex-col justify-between">
              <div>
                <p className="text-sm font-semibold text-white/70">
                  Road Not Taken
                </p>
                <h1 className="mt-4 max-w-sm text-4xl font-semibold leading-tight tracking-normal">
                  Create your map identity
                </h1>
              </div>
              <p className="mt-8 max-w-sm text-sm leading-6 text-white/68">
                Your name, avatar, and location help other explorers recognize
                the person behind each pin and comment.
              </p>
            </div>
          </section>

          <section className="p-5 sm:p-8">
            {isLoading ? (
              <div className="flex min-h-96 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-950" />
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                {error && (
                  <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </p>
                )}

                <label className="block">
                  <span className="text-xs font-semibold text-neutral-500">
                    Profile picture
                  </span>
                  <div className="mt-2 flex items-center gap-3">
                    {form.avatar_url ? (
                      <img
                        src={form.avatar_url}
                        alt=""
                        className="h-16 w-16 shrink-0 rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-neutral-950 text-lg font-semibold text-white">
                        {getInitial(form.display_name || form.username)}
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={isUploading}
                      className="min-w-0 flex-1 text-sm text-neutral-600 file:mr-3 file:rounded-full file:border-0 file:bg-neutral-950 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white disabled:opacity-60"
                    />
                  </div>
                  {isUploading && (
                    <span className="mt-1 block text-xs text-neutral-500">
                      Uploading...
                    </span>
                  )}
                </label>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-xs font-semibold text-neutral-500">
                      Display name
                    </span>
                    <input
                      value={form.display_name}
                      onChange={(event) =>
                        updateField("display_name", event.target.value)
                      }
                      maxLength={40}
                      className="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none transition focus:border-neutral-500"
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs font-semibold text-neutral-500">
                      Username
                    </span>
                    <input
                      value={form.username}
                      onChange={(event) =>
                        updateField("username", event.target.value)
                      }
                      maxLength={32}
                      className="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none transition focus:border-neutral-500"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="text-xs font-semibold text-neutral-500">
                    Location
                  </span>
                  <input
                    value={form.location}
                    onChange={(event) =>
                      updateField("location", event.target.value)
                    }
                    maxLength={80}
                    className="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none transition focus:border-neutral-500"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-semibold text-neutral-500">
                    Bio
                  </span>
                  <textarea
                    value={form.bio}
                    onChange={(event) => updateField("bio", event.target.value)}
                    rows={4}
                    maxLength={240}
                    className="mt-1.5 max-h-40 min-h-28 w-full resize-y rounded-xl border border-neutral-200 px-3 py-2.5 text-sm leading-6 outline-none transition focus:border-neutral-500"
                  />
                </label>

                <button
                  type="submit"
                  disabled={isSaving || isUploading}
                  className="w-full rounded-full bg-neutral-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
                >
                  {isSaving ? "Saving..." : "Continue to map"}
                </button>
              </form>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
