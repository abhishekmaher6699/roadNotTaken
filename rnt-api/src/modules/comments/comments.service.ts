import { getPool } from "../../config/db";
import { Comment, CommentLikeMutationResult, CreateCommentInput } from "./comments.types";

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

function buildCommentSelectFragment(viewerUserId?: string | null, tableName = "comments") {
  const likedExpression = viewerUserId
    ? `EXISTS (
        SELECT 1
        FROM comment_likes
        WHERE comment_likes.comment_id = ${tableName}.id
          AND comment_likes.user_id = $2
      )`
    : "false";

  return `
    ${tableName}.id,
    ${tableName}.pin_id,
    ${tableName}.parent_comment_id,
    ${tableName}.user_id,
    ${tableName}.content,
    ${tableName}.posted_by,
    json_build_object(
      'id', ${tableName}.user_id,
      'display_name', (
        SELECT profiles.display_name FROM profiles WHERE profiles.user_id = ${tableName}.user_id
      ),
      'username', (
        SELECT profiles.username FROM profiles WHERE profiles.user_id = ${tableName}.user_id
      ),
      'avatar_url', (
        SELECT profiles.avatar_url FROM profiles WHERE profiles.user_id = ${tableName}.user_id
      )
    ) AS author,
    COALESCE(${tableName}.likes_count, 0) AS likes_count,
    ${likedExpression} AS viewer_has_liked,
    ${tableName}.created_at,
    ${tableName}.updated_at
  `;
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
    `SELECT id FROM pins WHERE id = $1`,
    [pin_id],
  );

  if (!pinResult.rows[0]) {
    throw new CommentsServiceError("Pin not found", 404);
  }

  if (parent_comment_id != null) {
    const parentCommentResult = await pool.query(
      `SELECT id FROM comments WHERE id = $1 AND pin_id = $2`,
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
    `INSERT INTO comments (pin_id, user_id, content, posted_by, parent_comment_id) VALUES ($1, $2, $3, $4, $5) RETURNING ${buildCommentSelectFragment(null)}`,
    [pin_id, user_id, content, posted_by, parent_comment_id]
  );

  return result.rows[0];
}

export async function getCommentsForPin(pin_id: number, viewerUserId?: string | null): Promise<Comment[]> {
  const pool = getPool();
  const params = viewerUserId ? [pin_id, viewerUserId] : [pin_id];

  const result = await pool.query(
    `SELECT ${buildCommentSelectFragment(viewerUserId)} FROM comments WHERE pin_id = $1 ORDER BY created_at ASC`,
    params
  );

  return result.rows;
}

export async function deleteCommentById(comment_id: number, user_id: string): Promise<Comment | null> {
  const pool = getPool();

  const result = await pool.query(
    `DELETE FROM comments WHERE id = $1 AND user_id = $2 RETURNING ${buildCommentSelectFragment(null)}`,
    [comment_id, user_id]
  );

  return result.rows[0] || null;
}

export async function likeCommentById(
  commentId: number,
  userId: string,
): Promise<CommentLikeMutationResult | null> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const insertResult = await client.query(
      `
      INSERT INTO comment_likes (comment_id, user_id)
      VALUES ($1, $2)
      ON CONFLICT (comment_id, user_id) DO NOTHING
      RETURNING id;
      `,
      [commentId, userId],
    );

    if (insertResult.rowCount === 0) {
      const existing = await client.query(
        `SELECT COALESCE(likes_count, 0) AS likes_count FROM comments WHERE id = $1`,
        [commentId],
      );
      await client.query("COMMIT");
      return existing.rows[0]
        ? { liked: true, likes_count: existing.rows[0].likes_count }
        : null;
    }

    const updateResult = await client.query(
      `
      UPDATE comments
      SET likes_count = COALESCE(likes_count, 0) + 1
      WHERE id = $1
      RETURNING COALESCE(likes_count, 0) AS likes_count;
      `,
      [commentId],
    );

    await client.query("COMMIT");
    return updateResult.rows[0]
      ? { liked: true, likes_count: updateResult.rows[0].likes_count }
      : null;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function unlikeCommentById(
  commentId: number,
  userId: string,
): Promise<CommentLikeMutationResult | null> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const deleteResult = await client.query(
      `
      DELETE FROM comment_likes
      WHERE comment_id = $1 AND user_id = $2
      RETURNING id;
      `,
      [commentId, userId],
    );

    if ((deleteResult.rowCount ?? 0) > 0) {
      await client.query(
        `
        UPDATE comments
        SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0)
        WHERE id = $1
        `,
        [commentId],
      );
    }

    const result = await client.query(
      `SELECT COALESCE(likes_count, 0) AS likes_count FROM comments WHERE id = $1`,
      [commentId],
    );

    await client.query("COMMIT");
    return result.rows[0]
      ? { liked: false, likes_count: result.rows[0].likes_count }
      : null;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
