import { useState } from "react";
import { CommentItem } from "./CommentItem";
import type { Comment } from "../../../../../features/comments/api";
import type { User } from "../../../../../lib/auth";

interface CommentThreadProps {
  comments: Comment[];
  currentUser: User | null;
  replyToCommentId: number | null;
  replySubmittingCommentId: number | null;
  onReply: (commentId: number) => void;
  onDelete: (commentId: number) => Promise<void>;
  onToggleLike: (commentId: number) => Promise<void>;
  onSubmitReply: (parentCommentId: number, content: string) => Promise<void>;
  onOpenProfile?: (userId: string) => void;
}

export function CommentThread({
  comments,
  currentUser,
  replyToCommentId,
  replySubmittingCommentId,
  onReply,
  onDelete,
  onToggleLike,
  onSubmitReply,
  onOpenProfile,
}: CommentThreadProps) {
  const [collapsedComments, setCollapsedComments] = useState<Set<number>>(
    new Set(),
  );

  const toggleCollapse = (id: number) => {
    setCollapsedComments((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const commentsByParent = comments.reduce<Record<number, Comment[]>>(
    (acc, c) => {
      if (c.parent_comment_id != null) {
        acc[c.parent_comment_id] = acc[c.parent_comment_id] ?? [];
        acc[c.parent_comment_id].push(c);
      }
      return acc;
    },
    {},
  );

  const sort = (a: Comment, b: Comment) => {
    // fallback for optimistic / missing timestamps
    if (!a.created_at) return 1;
    if (!b.created_at) return -1;

    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  };
  const render = (comment: Comment, depth = 0, parent?: Comment) => {
    const replies = (commentsByParent[comment.id] ?? []).sort(sort);
    const collapsed = collapsedComments.has(comment.id);

    return (
      <div key={comment.id}>
        <CommentItem
          comment={comment}
          parentComment={parent}
          currentUser={currentUser}
          onReply={onReply}
          onDelete={onDelete}
          onToggleLike={onToggleLike}
          isReplying={replyToCommentId === comment.id}
          replySubmittingId={replySubmittingCommentId}
          onSubmitReply={onSubmitReply}
          onOpenProfile={onOpenProfile}
          isCollapsed={collapsed}
          onToggleCollapse={toggleCollapse}
          replyCount={replies.length}
        />

        {!collapsed && replies.length > 0 && (
          <div
            className={`ml-3 mt-1 space-y-1 border-l border-neutral-200 pl-2.5 ${
              depth >= 2 ? "sm:ml-1.5 sm:pl-2" : ""
            }`}
          >
            {replies.map((r) => render(r, depth + 1, comment))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-1">
      {comments
        .filter((c) => c.parent_comment_id == null)
        .sort(sort)
        .map((c) => render(c))}
    </div>
  );
}
