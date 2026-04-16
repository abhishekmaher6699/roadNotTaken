import { useState } from "react";
import type { Comment } from "../../../../../lib/comments";
import type { User } from "../../../../../lib/auth";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";// adjust path if needed

interface CommentItemProps {
  comment: Comment;
  depth: number;
  parentComment?: Comment;
  currentUser: User | null;
  onReply: (commentId: number) => void;
  onDelete: (commentId: number) => Promise<void>;
  isReplying: boolean;
  replySubmittingId: number | null;
  menuOpen: number | null;
  onToggleMenu: (commentId: number) => void;
  onSubmitReply: (parentCommentId: number, content: string) => Promise<void>;
  isCollapsed: boolean;
  onToggleCollapse: (commentId: number) => void;
  replyCount: number;
}

/* 🔥 Dynamic avatar color */
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

  /* ✅ Ownership check */
  const isOwner =
    currentUser &&
    String(currentUser.id) === String(comment.user_id);

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

  const initial =
    comment.posted_by?.trim()?.charAt(0)?.toUpperCase() || "?";

  return (
    <>
      <div
        className="relative rounded-xl border p-4 bg-white transition-all duration-200 hover:shadow-md hover:-translate-y-[1px]"
        style={{ marginLeft: depth * 20 }}
      >
        <div className="flex gap-3">

          {/* Collapse */}
          <button
            onClick={() => onToggleCollapse(comment.id)}
            className="text-xs text-neutral-400 hover:text-neutral-700 transition"
          >
            {isCollapsed ? ">" : "▼"}
          </button>

          {/* Avatar */}
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white shadow-sm ring-2 ring-white ${getAvatarColor(
              comment.user_id ?? comment.posted_by ?? "A"
            )}`}
          >
            {initial}
          </div>

          <div className="flex-1">

            {/* Header */}
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-semibold text-neutral-900">
                {comment.posted_by || "Anonymous"}
              </p>

              {isOwner && (
                <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                  You
                </span>
              )}

              <span className="text-xs text-neutral-500">
                {new Date(comment.created_at).toLocaleString()}
              </span>
            </div>

            {/* Content */}
            <p className="text-sm text-neutral-700 mb-2 leading-relaxed">
              {comment.content}
            </p>

            {/* Collapsed */}
            {isCollapsed && replyCount > 0 && (
              <p className="text-xs text-neutral-500 mb-2">
                {replyCount} replies hidden
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-4 text-xs text-neutral-500">
              <button
                onClick={() => onReply(comment.id)}
                className="hover:text-blue-600 transition-colors"
              >
                Reply
              </button>

              {isOwner && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="hover:text-red-500 transition-colors"
                >
                  Delete
                </button>
              )}
            </div>

            {/* Reply box */}
            {isReplying && !isCollapsed && (
              <form onSubmit={handleSubmitReply} className="mt-3 space-y-2">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                />
                <button
                  type="submit"
                  className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700"
                >
                  Reply
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* 🔥 Confirm Dialog */}
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
        <p className="text-xs text-neutral-500 line-clamp-3">
          {comment.content}
        </p>
      </ConfirmDialog>
    </>
  );
}