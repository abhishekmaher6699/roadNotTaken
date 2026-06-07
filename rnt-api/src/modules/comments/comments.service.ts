import { getPool } from "../../config/db";
import {
  Comment,
  CommentLikeMutationResult,
  CommentPage,
  CommentPageInput,
  CreateCommentInput,
} from "./comments.types";
import { commentQueries } from "./comments.queries";
import { buildCommentPage, prepareCommentPage } from "./comments.pagination";

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

export async function getCommentsForPin(
  pin_id: number,
  viewerUserId?: string | null,
  pageInput: CommentPageInput = {},
): Promise<CommentPage> {
  const pool = getPool();
  const { cursor, limit } = prepareCommentPage(pageInput);
  const pageParams: (number | string)[] = [pin_id];

  let cursorIdParam: string | undefined;

  if (cursor) {
    pageParams.push(cursor.id);
    cursorIdParam = `$${pageParams.length}`;
  }

  pageParams.push(limit + 1);
  const limitParam = `$${pageParams.length}`;

  const [topLevelResult, countResult] = await Promise.all([
    pool.query(
      commentQueries.getTopLevelCommentPage({
        cursorIdParam,
        limitParam,
      }),
      pageParams,
    ),
    pool.query(commentQueries.countCommentsForPin, [pin_id]),
  ]);
  const topLevelRows = topLevelResult.rows as Pick<Comment, "id">[];
  const visibleRootIds = topLevelRows.slice(0, limit).map((row) => row.id);

  let comments: Comment[] = [];

  if (visibleRootIds.length > 0) {
    const commentParams: (number[] | string)[] = [visibleRootIds];

    if (viewerUserId) {
      commentParams.push(viewerUserId);
    }

    const commentsResult = await pool.query(
      commentQueries.getCommentsForThreadRoots({
        viewerUserId,
        rootIdsParam: "$1",
        viewerUserIdParam: viewerUserId ? "$2" : undefined,
      }),
      commentParams,
    );
    comments = commentsResult.rows as Comment[];
  }

  return buildCommentPage(
    comments,
    topLevelRows,
    limit,
    countResult.rows[0]?.comment_count ?? 0,
  );
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
