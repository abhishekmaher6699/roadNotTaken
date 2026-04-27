import { useState } from "react";
import type { Comment } from "../../../../../features/comments/api";
import type { User } from "../../../../../lib/auth";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { LikeButton } from "@/components/ui/LikeButton";

interface CommentItemProps {
  comment: Comment;
  depth: number;
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
    "bg-red-400",
    "bg-green-400",
    "bg-blue-400",
    "bg-yellow-400",
    "bg-purple-400",
    "bg-pink-400",
    "bg-indigo-400",
    "bg-teal-400",
  ];

  const str = String(seed);
  const hash = str.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);

  return colors[hash % colors.length];
}

export function CommentItem({
  comment,
  depth,
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

  return (
    <>
      <div
        className="relative rounded-xl border bg-white p-4 transition-all duration-200 hover:-translate-y-[1px] hover:shadow-md"
        style={{ marginLeft: depth * 20 }}
      >
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => onToggleCollapse(comment.id)}
            className="text-xs text-neutral-400 transition hover:text-neutral-700"
          >
            {isCollapsed ? ">" : "v"}
          </button>

          <div
            className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white shadow-sm ring-2 ring-white ${getAvatarColor(
              comment.user_id ?? comment.posted_by ?? "A",
            )}`}
          >
            {initial}
          </div>

          <div className="flex-1">
            <div className="mb-1 flex items-center gap-2">
              <p className="text-sm font-semibold text-neutral-900">
                {comment.posted_by || "Anonymous"}
              </p>

              {isOwner && (
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] text-blue-600">
                  You
                </span>
              )}

              <span className="text-xs text-neutral-500">
                {new Date(comment.created_at).toLocaleString()}
              </span>
            </div>

            <p className="mb-2 text-sm leading-relaxed text-neutral-700">
              {comment.content}
            </p>

            {isCollapsed && replyCount > 0 && (
              <p className="mb-2 text-xs text-neutral-500">
                {replyCount} replies hidden
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
              <LikeButton
                liked={comment.viewer_has_liked}
                count={comment.likes_count}
                disabled={Boolean(
                  comment.isDeleting || comment.isOptimistic,
                )}
                onClick={() => onToggleLike(comment.id)}
                label="Comment"
                showLabel={false}
                className="min-h-0 px-2.5 py-1.5 text-xs"
              />

              <button
                type="button"
                onClick={() => onReply(comment.id)}
                className="transition-colors hover:text-blue-600"
              >
                Reply
              </button>

              {isOwner && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="transition-colors hover:text-red-500"
                >
                  Delete
                </button>
              )}
            </div>

            {isReplying && !isCollapsed && (
              <form onSubmit={handleSubmitReply} className="mt-3 space-y-2">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                />
                <button
                  type="submit"
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-700"
                >
                  Reply
                </button>
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
