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
    <main className="relative min-h-screen bg-[#faf6ee] text-[#432e18] px-4 py-8 sm:px-6 flex items-center justify-center overflow-hidden selection:bg-[#dda15e]/30 selection:text-[#432e18]">
      {/* Decorative Scrapbook Elements */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(#432e18_1px,transparent_1px),linear-gradient(90deg,#432e18_1px,transparent_1px)] [background-size:40px_40px]" />
        
        {/* Floating leaf doodle */}
        <div className="absolute top-[10%] left-[10%] opacity-20 text-[#606c38] animate-sway">
          <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L12 12m0-9c4.97 0 9 4.03 9 9 0 2.12-.74 4.07-1.97 5.61L12 12" />
          </svg>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 overflow-hidden rounded-3xl bg-[#fcf9f2] sketch-border sketch-shadow-lg lg:grid-cols-[0.9fr_1.1fr]">
        {/* Left Side: Scrapbook Brand Pane */}
        <section className="relative min-h-72 overflow-hidden bg-gradient-to-br from-[#faf6ee] to-[#f5eedb] p-8 text-[#432e18] flex flex-col justify-between border-b lg:border-b-0 lg:border-r-2 border-[#432e18]">
          <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(#432e18_1px,transparent_1px),linear-gradient(90deg,#432e18_1px,transparent_1px)] [background-size:40px_40px] pointer-events-none" />
          
          {/* Subtle sketched graphical nodes */}
          <div className="absolute left-12 top-20 text-[#606c38] w-8 h-10 animate-sway">
            <svg viewBox="0 0 24 32" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2 L3 16 H21 L12 2 Z" fill="#606c38" fillOpacity="0.1" />
              <path d="M12 12 L5 24 H19 L12 12 Z" fill="#606c38" fillOpacity="0.1" />
              <path d="M12 24v6" />
            </svg>
          </div>
          <div className="absolute bottom-20 right-14 text-[#dda15e] w-8 h-8 animate-doodle-bounce">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="8" fill="#dda15e" fillOpacity="0.1" />
              <circle cx="12" cy="12" r="4" fill="#dda15e" />
            </svg>
          </div>
          
          <div className="relative z-10 flex h-full flex-col justify-between gap-12">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#606c38]">
                Road Not Taken
              </p>
              <h1 className="mt-4 max-w-sm text-4xl font-black leading-tight tracking-tight text-[#432e18] sm:text-5xl font-display">
                Create your map identity
              </h1>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-[#432e18]/80 font-medium">
              Choose a handle handle, fill in a brief biography, and upload a profile picture to customize your explorer cards. Let others follow your markers.
            </p>
          </div>
        </section>

        {/* Right Side: Setup Form Pane */}
        <section className="p-6 sm:p-8 flex flex-col justify-center">
          {isLoading ? (
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#432e18]/20 border-t-[#606c38]" />
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit} noValidate>
              {error && (
                <p className="rounded-xl border-2 border-dashed border-rose-500/30 bg-rose-500/5 px-4 py-3 text-xs text-rose-700 flex items-center gap-2 font-semibold">
                  <svg className="w-4 h-4 shrink-0 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{error}</span>
                </p>
              )}

              {/* Avatar picture upload */}
              <div>
                <span className="text-xs font-bold text-[#432e18]/70 uppercase tracking-wider block mb-2">
                  Profile picture
                </span>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-[#faf6ee] sketch-border p-4 rounded-2xl shadow-sm">
                  <div className="flex justify-center shrink-0">
                    {form.avatar_url ? (
                      <img
                        src={form.avatar_url}
                        alt=""
                        className="h-16 w-16 rounded-2xl object-cover sketch-border"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#dda15e]/30 text-lg font-bold text-[#432e18] sketch-border select-none">
                        {getInitial(form.display_name || form.username)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-center gap-1.5 min-w-0">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={isUploading}
                      className="min-w-0 w-full text-xs text-[#432e18]/60 file:mr-3 file:rounded-full file:border-2 file:border-[#432e18] file:bg-white file:hover:bg-[#faf6ee] file:px-4 file:py-1.5 file:text-xs file:font-bold file:text-[#432e18] file:sketch-btn-transition disabled:opacity-60 cursor-pointer"
                    />
                    {isUploading && (
                      <span className="text-[10px] text-[#606c38] flex items-center gap-1.5 font-bold">
                        <span className="h-2 w-2 animate-ping bg-[#606c38] rounded-full" />
                        Uploading photo...
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Display & Username */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#432e18]/70 uppercase tracking-wider block">
                    Display Name
                  </label>
                  <input
                    value={form.display_name}
                    onChange={(event) =>
                      updateField("display_name", event.target.value)
                    }
                    maxLength={40}
                    placeholder="E.g. Arthur Pendragon"
                    className="w-full rounded-xl bg-[#faf6ee] sketch-border text-[#432e18] px-4 py-3 outline-none transition focus:bg-[#faf6ee]/60 focus:border-[#606c38] placeholder-[#432e18]/30 font-medium text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#432e18]/70 uppercase tracking-wider block">
                    Username
                  </label>
                  <input
                    value={form.username}
                    onChange={(event) =>
                      updateField("username", event.target.value)
                    }
                    maxLength={32}
                    placeholder="username"
                    className="w-full rounded-xl bg-[#faf6ee] sketch-border text-[#432e18] px-4 py-3 outline-none transition focus:bg-[#faf6ee]/60 focus:border-[#606c38] placeholder-[#432e18]/30 font-medium text-sm"
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#432e18]/70 uppercase tracking-wider block">
                  Location
                </label>
                <input
                  value={form.location}
                  onChange={(event) =>
                    updateField("location", event.target.value)
                  }
                  maxLength={80}
                  placeholder="E.g. Oregon Woods"
                  className="w-full rounded-xl bg-[#faf6ee] sketch-border text-[#432e18] px-4 py-3 outline-none transition focus:bg-[#faf6ee]/60 focus:border-[#606c38] placeholder-[#432e18]/30 font-medium text-sm"
                />
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#432e18]/70 uppercase tracking-wider block">
                  Biography
                </label>
                <textarea
                  value={form.bio}
                  onChange={(event) => updateField("bio", event.target.value)}
                  rows={3}
                  maxLength={240}
                  placeholder="Log details on the locations you sketch..."
                  className="max-h-36 min-h-24 w-full resize-y rounded-xl bg-[#faf6ee] sketch-border text-[#432e18] px-4 py-3 outline-none transition focus:bg-[#faf6ee]/60 focus:border-[#606c38] placeholder-[#432e18]/30 font-medium text-sm leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={isSaving || isUploading}
                className="w-full rounded-xl bg-[#606c38] text-white py-3.5 text-sm font-bold sketch-border sketch-shadow sketch-btn-transition hover:bg-[#505a2e] disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-100 border-t-white" />
                ) : null}
                <span>{isSaving ? "Saving details..." : "Continue to map"}</span>
              </button>
            </form>
          )}
        </section>

      </div>
    </main>
  );
}
