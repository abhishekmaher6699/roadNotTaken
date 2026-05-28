import { useEffect, useState } from "react";
import { CommentForm } from "./CommentForm";
import { CommentThread } from "./CommentThread";
import { useComments } from "../../../../../features/comments/hooks";
import { getCurrentUser, type User } from "../../../../../lib/auth";

interface CommentsSectionProps {
  pinId: number | null;
  onOpenProfile?: (userId: string) => void;
  focusedCommentId?: number | null;
  onCommentCountChange?: (delta: number) => void;
}

export function CommentsSection({
  pinId,
  onOpenProfile,
  focusedCommentId,
  onCommentCountChange,
}: CommentsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [replyToCommentId, setReplyToCommentId] = useState<number | null>(null);
  const [replySubmittingCommentId, setReplySubmittingCommentId] = useState<
    number | null
  >(null);
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

  const handleSubmitComment = async (content: string) => {
    if (!pinId) return;

    setIsSubmittingComment(true);
    try {
      const author = currentUser ?? (await getCurrentUser());
      if (author && !currentUser) {
        setCurrentUser(author);
      }

      await addComment(
        { pin_id: pinId, content },
        { id: author?.id, postedBy: author?.email ?? "Anonymous" },
      );
      onCommentCountChange?.(1);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleSubmitReply = async (
    parentCommentId: number,
    content: string,
  ) => {
    if (!pinId) return;

    setReplyToCommentId(null);
    setReplySubmittingCommentId(parentCommentId);

    try {
      const author = currentUser ?? (await getCurrentUser());
      if (author && !currentUser) {
        setCurrentUser(author);
      }

      await addComment(
        {
          pin_id: pinId,
          parent_comment_id: parentCommentId,
          content,
        },
        { id: author?.id, postedBy: author?.email ?? "Anonymous" },
      );
      onCommentCountChange?.(1);
    } finally {
      setReplySubmittingCommentId(null);
    }
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
      <button
        type="button"
        onClick={() => setIsExpanded((expanded) => !expanded)}
        className="flex w-full items-center justify-between gap-3 px-3.5 py-3 text-left transition hover:bg-neutral-50 sm:px-4"
        aria-expanded={isExpanded}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-900 text-white">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-3 w-3"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M7 8h10M7 12h6" strokeLinecap="round" />
                <path d="M6 18.5 9.5 16H17a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H7a3 3 0 0 0-3 3v5a3 3 0 0 0 3 3" />
              </svg>
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                Discussion
              </p>
              <h3 className="truncate text-base font-semibold text-neutral-950">
                Comments
              </h3>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-700">
            {comments.length}
          </span>
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition ${
              isExpanded ? "rotate-180" : ""
            }`}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-neutral-100">
          {commentsError && (
            <p className="mx-3.5 mt-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700 sm:mx-4">
              {commentsError}
            </p>
          )}

          <div className="px-3.5 py-2.5 sm:px-4">
            <CommentForm
              onSubmit={handleSubmitComment}
              isSubmitting={isSubmittingComment}
              placeholder="Add a comment"
            />
          </div>

          <div className="border-t border-neutral-100 px-1.5 py-1.5 sm:px-2">
            {commentsLoading ? (
              <p className="mx-2 rounded-xl bg-neutral-50 px-3 py-2.5 text-sm text-neutral-500">
                Loading comments...
              </p>
            ) : comments.length === 0 ? (
              <p className="mx-2 rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-4 text-center text-sm text-neutral-500">
                No comments yet.
              </p>
            ) : (
              <CommentThread
                comments={comments}
                currentUser={currentUser}
                replyToCommentId={replyToCommentId}
                replySubmittingCommentId={replySubmittingCommentId}
                onReply={(id) =>
                  setReplyToCommentId(replyToCommentId === id ? null : id)
                }
                onDelete={async (id) => {
                  const removedCount = await removeComment(id);
                  onCommentCountChange?.(-removedCount);
                }}
                onToggleLike={toggleLike}
                onSubmitReply={handleSubmitReply}
                onOpenProfile={onOpenProfile}
                focusedCommentId={focusedCommentId}
              />
            )}
          </div>
        </div>
      )}
    </section>
  );
}
