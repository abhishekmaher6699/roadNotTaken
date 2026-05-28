"use client";

import { useEffect, useState } from "react";
import { MapSidebarShell } from "../MapSidebarShell";
import { updateMyProfileApi, usePublicProfile } from "@/features/profiles";
import type { ProfileSidebarProps } from "./types";

function formatDate(date?: string | null) {
  if (!date) return "Unknown";

  return new Date(date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
  });
}

function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "?";
}

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white px-3 py-2">
      <p className="text-sm font-semibold text-neutral-950">
        {value.toLocaleString()}
      </p>
      <p className="mt-0.5 text-[11px] font-medium text-neutral-500">
        {label}
      </p>
    </div>
  );
}

type ProfileTab = "pins" | "comments";

export function ProfileSidebar({
  open,
  userId,
  fallbackEmail,
  canEdit = false,
  onClose,
}: ProfileSidebarProps) {
  const { profile, isLoading, error, refetch } = usePublicProfile(open ? userId : null);
  const [activeTab, setActiveTab] = useState<ProfileTab>("pins");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    display_name: "",
    username: "",
    bio: "",
    location: "",
    website: "",
    avatar_url: "",
  });

  useEffect(() => {
    const user = profile?.user;
    if (!user || isEditing) return;

    setForm({
      display_name: user.display_name ?? "",
      username: user.username ?? "",
      bio: user.bio ?? "",
      location: user.location ?? "",
      website: user.website ?? "",
      avatar_url: user.avatar_url ?? "",
    });
  }, [isEditing, profile?.user]);

  if (!open && !userId) return null;

  const user = profile?.user;
  const stats = profile?.stats;
  const displayName =
    user?.display_name ||
    user?.username ||
    fallbackEmail ||
    (user ? "Anonymous" : "Profile");
  const handle = user?.username
    ? `@${user.username}`
    : fallbackEmail || "Road Not Taken member";

  const saveProfile = async () => {
    setIsSaving(true);
    try {
      await updateMyProfileApi(form);
      await refetch();
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <MapSidebarShell
      open={open}
      title="Profile"
      description="Member identity and contribution stats."
      onClose={onClose}
      side="right"
    >
      <div className="space-y-3 pb-4">
        {isLoading && (
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-500">
            Loading profile...
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {user && stats && (
          <>
            <section className="rounded-2xl border border-neutral-200 bg-white p-4">
              {canEdit && (
                <div className="mb-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsEditing((value) => !value)}
                    className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50"
                  >
                    {isEditing ? "Cancel" : "Edit"}
                  </button>
                </div>
              )}

              <div className="flex items-start gap-3">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded-2xl object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-neutral-950 text-xl font-semibold text-white">
                    {getInitial(displayName)}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-lg font-semibold text-neutral-950">
                    {displayName}
                  </h3>
                  <p className="truncate text-sm text-neutral-500">{handle}</p>
                  <p className="mt-2 text-sm font-semibold text-neutral-800">
                    {stats.total_karma.toLocaleString()} karma
                  </p>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    Joined {formatDate(user.created_at)}
                  </p>
                </div>
              </div>

              {user.bio && (
                <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-neutral-700">
                  {user.bio}
                </p>
              )}

              {(user.location || user.website) && (
                <div className="mt-4 space-y-1.5 text-sm text-neutral-600">
                  {user.location && <p>{user.location}</p>}
                  {user.website && (
                    <a
                      href={user.website}
                      target="_blank"
                      rel="noreferrer"
                      className="block truncate font-medium text-neutral-950 underline-offset-4 hover:underline"
                    >
                      {user.website}
                    </a>
                  )}
                </div>
              )}

              {isEditing && (
                <form
                  className="mt-4 space-y-2 border-t border-neutral-100 pt-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void saveProfile();
                  }}
                >
                  <label className="block">
                    <span className="text-[11px] font-semibold text-neutral-500">
                      Display name
                    </span>
                    <input
                      value={form.display_name}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          display_name: event.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400"
                    />
                  </label>

                  <label className="block">
                    <span className="text-[11px] font-semibold text-neutral-500">
                      Username
                    </span>
                    <input
                      value={form.username}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          username: event.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400"
                    />
                  </label>

                  <label className="block">
                    <span className="text-[11px] font-semibold text-neutral-500">
                      Bio
                    </span>
                    <textarea
                      value={form.bio}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          bio: event.target.value,
                        }))
                      }
                      rows={3}
                      className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400"
                    />
                  </label>

                  <label className="block">
                    <span className="text-[11px] font-semibold text-neutral-500">
                      Location
                    </span>
                    <input
                      value={form.location}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          location: event.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400"
                    />
                  </label>

                  <label className="block">
                    <span className="text-[11px] font-semibold text-neutral-500">
                      Website
                    </span>
                    <input
                      value={form.website}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          website: event.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400"
                    />
                  </label>

                  <label className="block">
                    <span className="text-[11px] font-semibold text-neutral-500">
                      Avatar URL
                    </span>
                    <input
                      value={form.avatar_url}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          avatar_url: event.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400"
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full rounded-full bg-neutral-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:bg-neutral-300"
                  >
                    {isSaving ? "Saving..." : "Save profile"}
                  </button>
                </form>
              )}
            </section>

            <section className="grid grid-cols-2 gap-2">
              <StatItem label="Total karma" value={stats.total_karma} />
              <StatItem label="Pins" value={stats.pin_count} />
              <StatItem label="Pin karma" value={stats.pin_karma} />
              <StatItem label="Comments" value={stats.comment_count} />
              <StatItem label="Comment karma" value={stats.comment_karma} />
            </section>

            <section className="rounded-2xl border border-neutral-200 bg-white">
              <div className="grid grid-cols-2 border-b border-neutral-100 p-1">
                {(["pins", "comments"] as ProfileTab[]).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`rounded-xl px-3 py-2 text-sm font-semibold capitalize transition ${
                      activeTab === tab
                        ? "bg-neutral-950 text-white"
                        : "text-neutral-600 hover:bg-neutral-50"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="p-4 text-sm text-neutral-600">
                {activeTab === "pins"
                  ? `${stats.pin_count.toLocaleString()} pins`
                  : `${stats.comment_count.toLocaleString()} comments`}
              </div>
            </section>
          </>
        )}
      </div>
    </MapSidebarShell>
  );
}
