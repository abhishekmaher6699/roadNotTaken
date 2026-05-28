import { useState } from "react";
import type { Comment } from "../../../../../features/comments/api";
import type { User } from "../../../../../lib/auth";
import { ConfirmDialog } from "../../../../ui/ConfirmDialog";
import { LikeButton } from "../../../../ui/LikeButton";

interface CommentItemProps {
  comment: Comment;
  parentComment?: Comment;
  currentUser: User | null;
  onReply: (commentId: number) => void;
  onDelete: (commentId: number) => Promise<void>;
  onToggleLike: (commentId: number) => Promise<void>;
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

  const initial = comment.posted_by?.trim()?.charAt(0)?.toUpperCase() || "?";
  const createdAt = comment.created_at
    ? new Date(comment.created_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })
    : "Just now";

  return (
    <>
      <div
        className={`group relative rounded-xl px-2 py-2 transition hover:bg-neutral-50 ${
          comment.isDeleting ? "opacity-60" : ""
        }`}
      >
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => replyCount > 0 && onToggleCollapse(comment.id)}
            disabled={replyCount === 0}
            className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition ${
              replyCount > 0 ? "hover:ring-2 hover:ring-neutral-200" : ""
            } ${getAvatarColor(comment.user_id ?? comment.posted_by ?? "A")}`}
            aria-label={
              replyCount > 0
                ? `${isCollapsed ? "Show" : "Hide"} replies`
                : undefined
            }
          >
            {isCollapsed && replyCount > 0 ? "+" : initial}
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-neutral-950">
                  {comment.posted_by || "Anonymous"}
                </p>
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
              <LikeButton
                liked={comment.viewer_has_liked}
                count={comment.likes_count}
                disabled={Boolean(
                  comment.isDeleting || comment.isOptimistic,
                )}
                onClick={() => onToggleLike(comment.id)}
                label="Comment"
                showLabel={false}
                className="min-h-0 gap-1 rounded-full border-transparent bg-transparent px-1.5 py-0.5 text-xs shadow-none hover:bg-neutral-100 [&>svg]:h-3 [&>svg]:w-3 [&>span]:bg-transparent [&>span]:px-0.5 [&>span]:py-0 [&>span]:text-[11px]"
              />

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
