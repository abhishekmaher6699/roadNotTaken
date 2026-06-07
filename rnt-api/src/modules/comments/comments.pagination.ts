import type { Comment, CommentPage, CommentPageInput } from "./comments.types";

const DEFAULT_COMMENT_PAGE_LIMIT = 5;
const MAX_COMMENT_PAGE_LIMIT = 5;

function clampCommentPageLimit(limit?: number) {
  if (!Number.isFinite(limit) || !limit || limit <= 0) {
    return DEFAULT_COMMENT_PAGE_LIMIT;
  }

  return Math.min(Math.floor(limit), MAX_COMMENT_PAGE_LIMIT);
}

function encodeCommentCursor(comment: Comment) {
  return Buffer.from(JSON.stringify({ id: comment.id })).toString("base64url");
}

function decodeCommentCursor(cursor?: string | null) {
  if (!cursor) return null;

  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));

    if (Number.isInteger(parsed?.id)) {
      return { id: parsed.id as number };
    }
  } catch {
    return null;
  }

  return null;
}

export function parseCommentPageQuery(query: {
  cursor?: unknown;
  limit?: unknown;
}): CommentPageInput {
  const limit =
    typeof query.limit === "string" ? parseInt(query.limit, 10) : undefined;

  return {
    cursor: typeof query.cursor === "string" ? query.cursor : null,
    limit: Number.isFinite(limit) && limit && limit > 0 ? limit : undefined,
  };
}

export function prepareCommentPage(input: CommentPageInput) {
  return {
    cursor: decodeCommentCursor(input.cursor),
    limit: clampCommentPageLimit(input.limit),
  };
}

export function buildCommentPage(
  comments: Comment[],
  topLevelRows: Pick<Comment, "id">[],
  limit: number,
  commentCount: number,
): CommentPage {
  const topLevelComments = topLevelRows.slice(0, limit);
  const hasMore = topLevelRows.length > limit;
  const lastTopLevelComment = topLevelComments[topLevelComments.length - 1];

  return {
    comments,
    next_cursor:
      hasMore && lastTopLevelComment
        ? encodeCommentCursor(lastTopLevelComment as Comment)
        : null,
    has_more: hasMore,
    comment_count: commentCount,
  };
}
