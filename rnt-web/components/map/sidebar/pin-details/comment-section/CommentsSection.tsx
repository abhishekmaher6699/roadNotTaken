import { useState, useEffect } from "react";
import { CommentForm } from "./CommentForm";
import { CommentThread } from "./CommentThread";
import { useComments } from "../../../../../hooks/comments/useComments";
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
  } = useComments(pinId);

  useEffect(() => {
    if (pinId) fetchComments();
  }, [pinId, fetchComments]);

  useEffect(() => {
    getCurrentUser()
      .then((res: any) => setCurrentUser(res.user)) // ✅ FIX
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

    // ✅ CLOSE UI IMMEDIATELY
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
    <section className="rounded-3xl border border-neutral-200/70 bg-white/80 backdrop-blur-sm px-5 py-5 sm:px-6 shadow-sm hover:shadow-md transition-shadow">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-500/80">
        Community Activity
      </p>

      <h3 className="mt-1 text-lg font-semibold text-neutral-900">
        Comments & Discussion
      </h3>

      {commentsError && (
        <p className="mt-2 text-sm text-red-600">{commentsError}</p>
      )}

      <div className="mt-4">
        <CommentForm
          onSubmit={handleSubmitComment}
          isSubmitting={false}
          placeholder="Share your thoughts about this place..."
        />
      </div>

      <div className="mt-6">
        {commentsLoading ? (
          <p className="text-sm text-neutral-500">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-neutral-500">
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
            onToggleMenu={(id) => setMenuOpen(menuOpen === id ? null : id)}
            onSubmitReply={handleSubmitReply}
          />
        )}
      </div>
    </section>
  );
}
