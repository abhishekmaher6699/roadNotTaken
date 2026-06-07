import { getPool } from "../../config/db";
import { Comment, CommentLikeMutationResult, CreateCommentInput } from "./comments.types";
import { commentQueries } from "./comments.queries";

const MAX_COMMENT_LENGTH = 1000;

export class CommentsServiceError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "CommentsServiceError";
  }
}

export async function createComment(input: CreateCommentInput & { user_id: string }): Promise<Comment> {
  const pool = getPool();
  const { pin_id, posted_by, user_id, parent_comment_id = null } = input;
  const content = input.content.trim();

  if (!content) {
    throw new CommentsServiceError("Comment content cannot be empty", 400);
  }

  if (content.length > MAX_COMMENT_LENGTH) {
    throw new CommentsServiceError(
      `Comment content must be ${MAX_COMMENT_LENGTH} characters or fewer`,
      400,
    );
  }

  const pinResult = await pool.query(
    commentQueries.findPinById,
    [pin_id],
  );

  if (!pinResult.rows[0]) {
    throw new CommentsServiceError("Pin not found", 404);
  }

  if (parent_comment_id != null) {
    const parentCommentResult = await pool.query(
      commentQueries.findParentCommentForPin,
      [parent_comment_id, pin_id],
    );

    if (!parentCommentResult.rows[0]) {
      throw new CommentsServiceError(
        "Parent comment was not found for this pin",
        400,
      );
    }
  }

  const result = await pool.query(
    commentQueries.createComment,
    [pin_id, user_id, content, posted_by, parent_comment_id]
  );

  return result.rows[0];
}

export async function getCommentsForPin(pin_id: number, viewerUserId?: string | null): Promise<Comment[]> {
  const pool = getPool();
  const params = viewerUserId ? [pin_id, viewerUserId] : [pin_id];

  const result = await pool.query(
    commentQueries.getCommentsForPin(viewerUserId),
    params
  );

  return result.rows;
}

export async function deleteCommentById(comment_id: number, user_id: string): Promise<Comment | null> {
  const pool = getPool();

  const result = await pool.query(
    commentQueries.deleteComment,
    [comment_id, user_id]
  );

  return result.rows[0] || null;
}

export async function likeCommentById(
  commentId: number,
  userId: string,
): Promise<CommentLikeMutationResult | null> {
  const pool = getPool();

  const result = await pool.query(
    commentQueries.likeComment,
    [commentId, userId],
  );

  const row = result.rows[0];
  return row?.found ? { liked: row.liked, likes_count: row.likes_count } : null;
}

export async function unlikeCommentById(
  commentId: number,
  userId: string,
): Promise<CommentLikeMutationResult | null> {
  const pool = getPool();

  const result = await pool.query(
    commentQueries.unlikeComment,
    [commentId, userId],
  );

  const row = result.rows[0];
  return row?.found ? { liked: row.liked, likes_count: row.likes_count } : null;
}
