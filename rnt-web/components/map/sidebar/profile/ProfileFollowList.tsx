import type { ProfileFollowListKind, ProfileFollowListUser } from "@/features/profiles";
import { getOptimizedCloudinaryUrl } from "@/lib/cloudinary";
import { getInitial } from "./utils";

interface ProfileFollowListProps {
  kind: ProfileFollowListKind;
  users: ProfileFollowListUser[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  onBack: () => void;
  onLoadMore: () => void;
  onOpenProfile?: (userId: string) => void;
}

function getListTitle(kind: ProfileFollowListKind) {
  return kind === "followers" ? "Followers" : "Following";
}

function getEmptyMessage(kind: ProfileFollowListKind) {
  return kind === "followers"
    ? "No followers yet."
    : "Not following anyone yet.";
}

function ProfileFollowListRow({
  user,
  onOpenProfile,
}: {
  user: ProfileFollowListUser;
  onOpenProfile?: (userId: string) => void;
}) {
  const displayName = user.display_name || user.username || "Anonymous";
  const handle = user.username ? `@${user.username}` : user.location || "Road Not Taken member";
  const avatarUrl = user.avatar_url
    ? getOptimizedCloudinaryUrl(user.avatar_url, "avatar") ?? user.avatar_url
    : null;

  return (
    <button
      type="button"
      onClick={() => onOpenProfile?.(user.user_id)}
      className="flex w-full items-center gap-3 border-b border-neutral-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950"
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-11 w-11 shrink-0 rounded-xl object-cover"
        />
      ) : (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-neutral-950 text-sm font-semibold text-white">
          {getInitial(displayName)}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-neutral-950">
            {displayName}
          </p>
          {user.viewer_has_followed && (
            <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-neutral-600">
              Following
            </span>
          )}
        </div>
        <p className="truncate text-xs text-neutral-500">{handle}</p>
        <p className="mt-1 truncate text-[11px] font-medium text-neutral-500">
          {user.pin_count.toLocaleString()} pins &middot;{" "}
          {user.comment_count.toLocaleString()} comments &middot;{" "}
          {user.total_karma.toLocaleString()} karma
        </p>
      </div>
    </button>
  );
}

export function ProfileFollowList({
  kind,
  users,
  isLoading,
  isLoadingMore,
  error,
  hasMore,
  onBack,
  onLoadMore,
  onOpenProfile,
}: ProfileFollowListProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
      <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
        <div>
          <h4 className="text-sm font-semibold text-neutral-950">
            {getListTitle(kind)}
          </h4>
          <p className="text-xs text-neutral-500">
            Tap a profile to open it.
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50"
        >
          Back
        </button>
      </div>

      {error && (
        <div className="border-b border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="px-4 py-6 text-sm text-neutral-500">Loading...</div>
      ) : users.length ? (
        <div>
          {users.map((user) => (
            <ProfileFollowListRow
              key={user.user_id}
              user={user}
              onOpenProfile={onOpenProfile}
            />
          ))}
        </div>
      ) : (
        <div className="px-4 py-6 text-sm text-neutral-500">
          {getEmptyMessage(kind)}
        </div>
      )}

      {hasMore && !isLoading && (
        <div className="border-t border-neutral-100 p-3">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoadingMore ? "Loading..." : "Load more"}
          </button>
        </div>
      )}
    </section>
  );
}
