import type { PublicProfileResponse } from "@/features/profiles";
import { getOptimizedCloudinaryUrl } from "@/lib/cloudinary";
import { formatDate, getInitial } from "./utils";

interface ProfileHeaderProps {
  user: PublicProfileResponse["user"];
  stats: PublicProfileResponse["stats"];
  canEdit: boolean;
  isEditing: boolean;
  onToggleEdit: () => void;
}

export function ProfileHeader({
  user,
  stats,
  canEdit,
  isEditing,
  onToggleEdit,
}: ProfileHeaderProps) {
  const displayName =
    user.display_name || user.username || "Anonymous";
  const handle = user.username ? `@${user.username}` : "Road Not Taken member";

  return (
    <>
      <section className="rounded-2xl border border-neutral-200 bg-white p-4">
        <div className="flex items-start gap-3">
          {user.avatar_url ? (
            <img
              src={getOptimizedCloudinaryUrl(user.avatar_url, "avatar") ?? user.avatar_url}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-20 w-20 shrink-0 rounded-2xl object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-neutral-950 text-2xl font-semibold text-white">
              {getInitial(displayName)}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex min-h-20 flex-col justify-center gap-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate text-xl font-semibold text-neutral-950">
                    {displayName}
                  </h3>
                  <p className="truncate text-sm text-neutral-500">{handle}</p>
                </div>
                {canEdit && (
                  <button
                    type="button"
                    onClick={onToggleEdit}
                    className="shrink-0 rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50"
                  >
                    {isEditing ? "Cancel" : "Edit"}
                  </button>
                )}
              </div>

              {user.location && (
                <p className="truncate text-sm text-neutral-600">
                  {user.location}
                </p>
              )}
            </div>
          </div>
        </div>

        {user.bio && (
          <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-neutral-700">
            {user.bio}
          </p>
        )}

        <p className="mt-3 text-xs font-medium text-neutral-500">
          Joined {formatDate(user.created_at)}
        </p>
      </section>

      <section className="grid grid-cols-3 overflow-hidden rounded-2xl border border-neutral-200 bg-white text-center">
        <div className="border-r border-neutral-200 px-2 py-3">
          <p className="text-base font-semibold text-neutral-950">
            {stats.total_karma.toLocaleString()}
          </p>
          <p className="text-[10px] font-semibold uppercase text-neutral-500">
            Karma
          </p>
        </div>
        <div className="border-r border-neutral-200 px-2 py-3">
          <p className="text-base font-semibold text-neutral-950">
            {stats.pin_count.toLocaleString()}
          </p>
          <p className="text-[10px] font-semibold uppercase text-neutral-500">
            Pins
          </p>
        </div>
        <div className="px-2 py-3">
          <p className="text-base font-semibold text-neutral-950">
            {stats.comment_count.toLocaleString()}
          </p>
          <p className="text-[10px] font-semibold uppercase text-neutral-500">
            Comments
          </p>
        </div>
      </section>
    </>
  );
}
