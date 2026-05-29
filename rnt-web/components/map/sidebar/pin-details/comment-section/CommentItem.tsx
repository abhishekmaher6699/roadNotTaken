import { useEffect, useRef, useState } from "react";
import type { Comment } from "../../../../../features/comments/api";
import type { User } from "../../../../../lib/auth";
import { ConfirmDialog } from "../../../../ui/ConfirmDialog";

interface CommentItemProps {
  comment: Comment;
  parentComment?: Comment;
  currentUser: User | null;
  onReply: (commentId: number) => void;
  onDelete: (commentId: number) => Promise<void>;
  onToggleLike: (commentId: number) => Promise<Comment | null>;
  onOpenProfile?: (userId: string) => void;
  isFocused?: boolean;
  isReplying: boolean;
  replySubmittingId: number | null;
  onSubmitReply: (parentCommentId: number, content: string) => Promise<void>;
  isCollapsed: boolean;
  onToggleCollapse: (commentId: number) => void;
  replyCount: number;
}

function getAvatarColor(seed: string | number) {
  const colors = [
    "bg-rose-100 text-rose-700",
    "bg-emerald-100 text-emerald-700",
    "bg-sky-100 text-sky-700",
    "bg-amber-100 text-amber-800",
    "bg-violet-100 text-violet-700",
    "bg-pink-100 text-pink-700",
    "bg-indigo-100 text-indigo-700",
    "bg-teal-100 text-teal-700",
  ];

  const str = String(seed);
  const hash = str.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);

  return colors[hash % colors.length];
}

export function CommentItem({
  comment,
  currentUser,
  onReply,
  onDelete,
  onToggleLike,
  onOpenProfile,
  isFocused = false,
  isReplying,
  replySubmittingId,
  onSubmitReply,
  isCollapsed,
  onToggleCollapse,
  replyCount,
}: CommentItemProps) {
  const [replyText, setReplyText] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const itemRef = useRef<HTMLDivElement | null>(null);

  const isOwner =
    currentUser && String(currentUser.id) === String(comment.user_id);

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || replySubmittingId) return;

    const content = replyText.trim();
    setReplyText("");

    try {
      await onSubmitReply(comment.id, content);
    } catch {
      setReplyText(content);
    }
  };

  const authorName =
    comment.author?.display_name ||
    comment.author?.username ||
    "Anonymous";
  const avatarUrl = comment.author?.avatar_url;
  const initial = authorName.trim().charAt(0).toUpperCase() || "?";
  const createdAt = comment.created_at
    ? new Date(comment.created_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })
    : "Just now";
  const authorNameBaseClass =
    "block max-w-full truncate text-left text-[13px] font-semibold text-neutral-950";
  const clickableAuthorNameClass =
    "block w-fit max-w-full truncate border-b border-transparent text-left text-[13px] font-semibold leading-5 text-neutral-950 transition hover:border-neutral-950";

  useEffect(() => {
    if (!isFocused) return;
    itemRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [isFocused]);

  return (
    <>
      <div
        ref={itemRef}
        className={`group relative rounded-xl px-2 py-2 transition hover:bg-neutral-50 ${
          comment.isDeleting ? "opacity-60" : ""
        } ${isFocused ? "bg-amber-50 ring-1 ring-amber-200" : ""}`}
      >
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() =>
              comment.user_id && onOpenProfile
                ? onOpenProfile(comment.user_id)
                : replyCount > 0
                  ? onToggleCollapse(comment.id)
                  : undefined
            }
            className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full text-[11px] font-semibold transition ${
              comment.user_id && onOpenProfile ? "hover:ring-2 hover:ring-neutral-200" : ""
            } ${getAvatarColor(comment.user_id ?? comment.posted_by ?? "A")}`}
            aria-label="Open profile"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              initial
            )}
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
              <div className="min-w-0">
                {comment.user_id && onOpenProfile ? (
                  <button
                    type="button"
                    onClick={() => onOpenProfile(comment.user_id)}
                    className={clickableAuthorNameClass}
                  >
                    {authorName}
                  </button>
                ) : (
                  <p className={authorNameBaseClass}>
                    {authorName}
                  </p>
                )}
              </div>

              {isOwner && (
                <span className="rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-600">
                  You
                </span>
              )}

              <span className="text-[11px] text-neutral-400">- {createdAt}</span>
              {comment.isOptimistic && (
                <span className="text-[11px] text-neutral-400">Posting</span>
              )}
            </div>

            <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-neutral-700">
              {comment.content}
            </p>

            {isCollapsed && replyCount > 0 && (
              <button
                type="button"
                onClick={() => onToggleCollapse(comment.id)}
                className="mt-1.5 rounded-full px-2 py-0.5 text-xs font-semibold text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900"
              >
                {replyCount} {replyCount === 1 ? "reply" : "replies"} hidden
              </button>
            )}

            <div className="mt-1.5 flex flex-wrap items-center gap-0.5 text-xs text-neutral-500">
              <button
                type="button"
                aria-pressed={comment.viewer_has_liked}
                aria-label={`${comment.viewer_has_liked ? "Unlike" : "Like"} this comment`}
                disabled={Boolean(
                  comment.isDeleting || comment.isOptimistic,
                )}
                onClick={() => void onToggleLike(comment.id)}
                className={`inline-flex items-center gap-1 rounded px-1 py-0.5 font-semibold transition-colors hover:bg-neutral-100 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-60 ${
                  comment.viewer_has_liked ? "text-rose-600" : ""
                }`}
              >
                <span aria-hidden="true">
                  {comment.viewer_has_liked ? "♥" : "♡"}
                </span>
                <span>{comment.likes_count}</span>
              </button>

              <button
                type="button"
                onClick={() => onReply(comment.id)}
                className={`rounded-full px-1.5 py-0.5 font-semibold transition-colors hover:bg-neutral-100 hover:text-neutral-900 ${
                  isReplying ? "bg-neutral-100 text-neutral-900" : ""
                }`}
              >
                Reply
              </button>

              {replyCount > 0 && (
                <button
                  type="button"
                  onClick={() => onToggleCollapse(comment.id)}
                  className="rounded-full px-1.5 py-0.5 font-semibold transition-colors hover:bg-neutral-100 hover:text-neutral-900"
                >
                  {isCollapsed ? "Show" : "Collapse"}
                </button>
              )}

              {isOwner && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="rounded-full px-1.5 py-0.5 font-semibold transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  Delete
                </button>
              )}
            </div>

            {isReplying && !isCollapsed && (
              <form
                onSubmit={handleSubmitReply}
                className="mt-2 space-y-2 rounded-xl border border-neutral-200 bg-white p-2"
              >
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={2}
                  placeholder="Write a reply..."
                  maxLength={1000}
                  className="max-h-28 min-h-12 w-full resize-y rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-sm leading-6 outline-none placeholder:text-neutral-400 focus:border-neutral-400 focus:bg-white"
                />
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-neutral-400">
                    {replyText.trim().length}/1000
                  </span>
                  <button
                    type="submit"
                    disabled={!replyText.trim() || Boolean(replySubmittingId)}
                    className="rounded-full bg-neutral-950 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
                  >
                    {replySubmittingId === comment.id ? "Replying..." : "Reply"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete comment?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        tone="danger"
        isConfirming={isDeleting}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={async () => {
          setIsDeleting(true);
          try {
            await onDelete(comment.id);
            setShowDeleteConfirm(false);
          } finally {
            setIsDeleting(false);
          }
        }}
      >
        <p className="line-clamp-3 text-xs text-neutral-500">
          {comment.content}
        </p>
      </ConfirmDialog>
    </>
  );
}
