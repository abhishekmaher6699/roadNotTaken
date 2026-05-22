import { useState } from "react";
import type { Comment } from "../../../../../features/comments/api";
import type { User } from "../../../../../lib/auth";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { LikeButton } from "@/components/ui/LikeButton";

interface CommentItemProps {
  comment: Comment;
  parentComment?: Comment;
  currentUser: User | null;
  onReply: (commentId: number) => void;
  onDelete: (commentId: number) => Promise<void>;
  onToggleLike: (commentId: number) => Promise<void>;
  isReplying: boolean;
  replySubmittingId: number | null;
  menuOpen: number | null;
  onToggleMenu: (commentId: number) => void;
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
        hour: "numeric",
        minute: "2-digit",
      })
    : "Just now";

  return (
    <>
      <div
        className="relative rounded-xl border border-neutral-200 bg-white p-3.5 transition hover:border-neutral-300"
      >
        <div className="flex gap-3">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${getAvatarColor(
              comment.user_id ?? comment.posted_by ?? "A",
            )}`}
          >
            {initial}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-neutral-950">
                  {comment.posted_by || "Anonymous"}
                </p>
              </div>

              {isOwner && (
                <span className="rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-600">
                  You
                </span>
              )}

              <span className="text-xs text-neutral-400">{createdAt}</span>
            </div>

            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-neutral-700">
              {comment.content}
            </p>

            {isCollapsed && replyCount > 0 && (
              <p className="mt-2 text-xs text-neutral-500">
                {replyCount} replies hidden
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
              <LikeButton
                liked={comment.viewer_has_liked}
                count={comment.likes_count}
                disabled={Boolean(
                  comment.isDeleting || comment.isOptimistic,
                )}
                onClick={() => onToggleLike(comment.id)}
                label="Comment"
                showLabel={false}
                className="min-h-0 gap-1 border-transparent bg-transparent px-1.5 py-0.5 text-xs shadow-none hover:bg-neutral-100 [&>svg]:h-3.5 [&>svg]:w-3.5 [&>span]:bg-transparent [&>span]:px-0.5 [&>span]:py-0"
              />

              <button
                type="button"
                onClick={() => onReply(comment.id)}
                className="rounded-full px-2 py-1 font-medium transition-colors hover:bg-neutral-100 hover:text-neutral-900"
              >
                Reply
              </button>

              {replyCount > 0 && (
                <button
                  type="button"
                  onClick={() => onToggleCollapse(comment.id)}
                  className="rounded-full px-2 py-1 font-medium transition-colors hover:bg-neutral-100 hover:text-neutral-900"
                >
                  {isCollapsed ? "Show replies" : "Hide replies"}
                </button>
              )}

              {isOwner && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="rounded-full px-2 py-1 font-medium transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  Delete
                </button>
              )}
            </div>

            {isReplying && !isCollapsed && (
              <form onSubmit={handleSubmitReply} className="mt-3 space-y-2 rounded-xl bg-neutral-50 p-3">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={2}
                  placeholder="Write a reply..."
                  className="w-full resize-none rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm leading-6 outline-none focus:border-neutral-400"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!replyText.trim() || Boolean(replySubmittingId)}
                    className="rounded-full bg-neutral-950 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
                  >
                    Reply
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
