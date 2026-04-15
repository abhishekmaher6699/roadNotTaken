import { getPool } from "../../config/db";
import { CreateCommentInput, Comment } from "./comments.types";

const COMMENT_SELECT_FRAGMENT = `
  id,
  pin_id,
  parent_comment_id,
  user_id,
  content,
  posted_by,
  created_at,
  updated_at
`;

export async function createComment(input: CreateCommentInput & { user_id: string }): Promise<Comment> {
  const pool = getPool();
  const { pin_id, content, posted_by, user_id, parent_comment_id = null } = input;

  const result = await pool.query(
    `INSERT INTO comments (pin_id, user_id, content, posted_by, parent_comment_id) VALUES ($1, $2, $3, $4, $5) RETURNING ${COMMENT_SELECT_FRAGMENT}`,
    [pin_id, user_id, content, posted_by, parent_comment_id]
  );

  return result.rows[0];
}

export async function getCommentsForPin(pin_id: number): Promise<Comment[]> {
  const pool = getPool();

  const result = await pool.query(
    `SELECT ${COMMENT_SELECT_FRAGMENT} FROM comments WHERE pin_id = $1 ORDER BY created_at ASC`,
    [pin_id]
  );

  return result.rows;
}

export async function deleteCommentById(comment_id: number, user_id: string): Promise<Comment | null> {
  const pool = getPool();

  const result = await pool.query(
    `DELETE FROM comments WHERE id = $1 AND user_id = $2 RETURNING ${COMMENT_SELECT_FRAGMENT}`,
    [comment_id, user_id]
  );

  return result.rows[0] || null;
}