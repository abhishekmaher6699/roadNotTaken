import { useState } from "react";
import { CommentItem } from "./CommentItem";
import type { Comment } from "../../../../../features/comments/api";
import type { User } from "../../../../../lib/auth";

const NESTED_EXPAND_LEVELS = 3;

interface CommentThreadProps {
  comments: Comment[];
  currentUser: User | null;
  replyToCommentId: number | null;
  replySubmittingCommentId: number | null;
  onReply: (commentId: number) => void;
  onDelete: (commentId: number) => Promise<void>;
  onToggleLike: (commentId: number) => Promise<Comment | null>;
  onSubmitReply: (parentCommentId: number, content: string) => Promise<void>;
  onOpenProfile?: (userId: string) => void;
  focusedCommentId?: number | null;
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
  focusedCommentId,
}: CommentThreadProps) {
  const [collapsedComments, setCollapsedComments] = useState<Set<number>>(
    new Set(),
  );
  const [expandedNestedComments, setExpandedNestedComments] = useState<Set<number>>(
    new Set(),
  );

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

  const toggleSetValue = (prev: Set<number>, id: number) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
  };

  const collectExpandableNestedIds = (id: number, remainingLevels: number) => {
    const ids = new Set<number>([id]);

    if (remainingLevels <= 0) {
      return ids;
    }

    (commentsByParent[id] ?? []).forEach((reply) => {
      collectExpandableNestedIds(reply.id, remainingLevels - 1).forEach(
        (replyId) => ids.add(replyId),
      );
    });

    return ids;
  };

  const toggleCollapse = (id: number, isNestedReply: boolean) => {
    if (isNestedReply) {
      setExpandedNestedComments((prev) => {
        const next = new Set(prev);
        const chunkIds = collectExpandableNestedIds(
          id,
          NESTED_EXPAND_LEVELS - 1,
        );

        if (next.has(id)) {
          chunkIds.forEach((chunkId) => next.delete(chunkId));
        } else {
          chunkIds.forEach((chunkId) => next.add(chunkId));
        }

        return next;
      });
      return;
    }

    setCollapsedComments((prev) => {
      return toggleSetValue(prev, id);
    });
  };

  const sort = (a: Comment, b: Comment) => {
    // fallback for optimistic / missing timestamps
    if (!a.created_at) return 1;
    if (!b.created_at) return -1;

    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  };
  const render = (comment: Comment, depth = 0, parent?: Comment) => {
    const replies = (commentsByParent[comment.id] ?? []).sort(sort);
    const isNestedReply = depth > 0;
    const collapsed =
      isNestedReply && replies.length > 0
        ? !expandedNestedComments.has(comment.id)
        : collapsedComments.has(comment.id);

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
          isFocused={focusedCommentId === comment.id}
          isCollapsed={collapsed}
          onToggleCollapse={(id) => toggleCollapse(id, isNestedReply)}
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
