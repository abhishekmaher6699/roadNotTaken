"use client";

import { MapSidebarShell } from "../MapSidebarShell";
import { usePublicProfile } from "@/features/profiles";
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

export function ProfileSidebar({
  open,
  userId,
  fallbackEmail,
  onClose,
}: ProfileSidebarProps) {
  const { profile, isLoading, error } = usePublicProfile(open ? userId : null);

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
            </section>

            <section className="grid grid-cols-2 gap-2">
              <StatItem label="Total karma" value={stats.total_karma} />
              <StatItem label="Pins" value={stats.pin_count} />
              <StatItem label="Pin karma" value={stats.pin_karma} />
              <StatItem label="Comments" value={stats.comment_count} />
              <StatItem label="Comment karma" value={stats.comment_karma} />
            </section>
          </>
        )}
      </div>
    </MapSidebarShell>
  );
}
