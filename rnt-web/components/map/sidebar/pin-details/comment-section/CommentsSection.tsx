import { useEffect, useState } from "react";
import { CommentForm } from "./CommentForm";
import { CommentThread } from "./CommentThread";
import { useComments } from "../../../../../features/comments/hooks";
import { getCurrentUser, type User } from "../../../../../lib/auth";

interface CommentsSectionProps {
  pinId: number | null;
}

export function CommentsSection({ pinId }: CommentsSectionProps) {
  const [replyToCommentId, setReplyToCommentId] = useState<number | null>(null);
  const [replySubmittingCommentId, setReplySubmittingCommentId] = useState<
    number | null
  >(null);
  const [menuOpen, setMenuOpen] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const {
    comments,
    loading: commentsLoading,
    error: commentsError,
    fetchComments,
    addComment,
    removeComment,
    toggleLike,
  } = useComments(pinId);

  useEffect(() => {
    if (pinId) {
      void fetchComments();
    }
  }, [pinId, fetchComments]);

  useEffect(() => {
    getCurrentUser()
      .then((user) => setCurrentUser(user))
      .catch(() => setCurrentUser(null));
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".comment-menu")) {
        setMenuOpen(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmitComment = async (content: string) => {
    if (!pinId) return;
    await addComment({ pin_id: pinId, content });
  };

  const handleSubmitReply = async (
    parentCommentId: number,
    content: string,
  ) => {
    if (!pinId) return;

    setReplyToCommentId(null);
    setReplySubmittingCommentId(parentCommentId);

    try {
      await addComment({
        pin_id: pinId,
        parent_comment_id: parentCommentId,
        content,
      });
    } finally {
      setReplySubmittingCommentId(null);
    }
  };

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white">
      <div className="border-b border-neutral-100 px-4 py-4 sm:px-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
              Discussion
            </p>
            <h3 className="mt-1 text-base font-semibold text-neutral-950">
              Comments
            </h3>
          </div>

          <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-600">
            {comments.length}
          </span>
        </div>
      </div>

      {commentsError && (
        <p className="mx-4 mt-4 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700 sm:mx-5">
          {commentsError}
        </p>
      )}

      <div className="px-4 py-4 sm:px-5">
        <CommentForm
          onSubmit={handleSubmitComment}
          isSubmitting={false}
          placeholder="Share your thoughts about this place..."
        />
      </div>

      <div className="border-t border-neutral-100 px-4 py-4 sm:px-5">
        {commentsLoading ? (
          <p className="rounded-xl bg-neutral-50 px-3 py-3 text-sm text-neutral-500">
            Loading comments...
          </p>
        ) : comments.length === 0 ? (
          <p className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-5 text-center text-sm text-neutral-500">
            No comments yet. Be the first to share your thoughts!
          </p>
        ) : (
          <CommentThread
            comments={comments}
            currentUser={currentUser}
            replyToCommentId={replyToCommentId}
            replySubmittingCommentId={replySubmittingCommentId}
            menuOpen={menuOpen}
            onReply={(id) =>
              setReplyToCommentId(replyToCommentId === id ? null : id)
            }
            onDelete={async (id) => {
              await removeComment(id);
              setMenuOpen(null);
            }}
            onToggleLike={toggleLike}
            onToggleMenu={(id) => setMenuOpen(menuOpen === id ? null : id)}
            onSubmitReply={handleSubmitReply}
          />
        )}
      </div>
    </section>
  );
}
