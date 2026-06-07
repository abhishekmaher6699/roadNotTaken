function buildCommentSelectFragment(
  viewerUserId?: string | null,
  tableName = "comments",
  viewerUserIdParam = "$2",
  profileTableName: string | null = "profiles",
) {
  const likedExpression =
    profileTableName === null
      ? `${tableName}.viewer_has_liked`
      : viewerUserId
        ? `EXISTS (
        SELECT 1
        FROM comment_likes
        WHERE comment_likes.comment_id = ${tableName}.id
          AND comment_likes.user_id = ${viewerUserIdParam}
      )`
        : "false";
  const authorExpression =
    profileTableName === null
      ? `${tableName}.author`
      : `json_build_object(
      'id', ${tableName}.user_id,
      'display_name', ${profileTableName}.display_name,
      'username', ${profileTableName}.username,
      'avatar_url', ${profileTableName}.avatar_url
    )`;

  return `
    ${tableName}.id,
    ${tableName}.pin_id,
    ${tableName}.parent_comment_id,
    ${tableName}.user_id,
    ${tableName}.content,
    ${tableName}.posted_by,
    ${authorExpression} AS author,
    COALESCE(${tableName}.likes_count, 0) AS likes_count,
    ${likedExpression} AS viewer_has_liked,
    ${tableName}.created_at,
    ${tableName}.updated_at
  `;
}

export const commentQueries = {
  findPinById: `SELECT id FROM pins WHERE id = $1`,

  findParentCommentForPin: `SELECT id FROM comments WHERE id = $1 AND pin_id = $2`,

  countCommentsForPin: `
    SELECT COUNT(*)::integer AS comment_count
    FROM comments
    WHERE pin_id = $1
  `,

  createComment: `
    WITH inserted_comment AS (
      INSERT INTO comments (pin_id, user_id, content, posted_by, parent_comment_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    )
    SELECT ${buildCommentSelectFragment(null, "inserted_comment")}
    FROM inserted_comment
    LEFT JOIN profiles ON profiles.user_id = inserted_comment.user_id;
  `,

  getTopLevelCommentPage({
    cursorIdParam,
    limitParam,
  }: {
    cursorIdParam?: string;
    limitParam: string;
  }) {
    const cursorClause =
      cursorIdParam
        ? `AND id > ${cursorIdParam}::integer`
        : "";

    return `
      SELECT id
      FROM comments
      WHERE pin_id = $1
        AND parent_comment_id IS NULL
        ${cursorClause}
      ORDER BY id ASC
      LIMIT ${limitParam}
    `;
  },

  getCommentsForThreadRoots({
    viewerUserId,
    rootIdsParam,
    viewerUserIdParam,
  }: {
    viewerUserId?: string | null;
    rootIdsParam: string;
    viewerUserIdParam?: string;
  }) {
    return `
      WITH RECURSIVE comment_tree AS (
        SELECT comments.*, comments.id AS root_id
        FROM comments
        WHERE comments.id = ANY(${rootIdsParam}::integer[])

        UNION ALL

        SELECT replies.*, comment_tree.root_id
        FROM comments replies
        INNER JOIN comment_tree ON comment_tree.id = replies.parent_comment_id
        WHERE replies.pin_id = comment_tree.pin_id
      )
      SELECT ${buildCommentSelectFragment(
        viewerUserId,
        "comments",
        viewerUserIdParam,
      )}
      FROM comment_tree comments
      LEFT JOIN profiles ON profiles.user_id = comments.user_id
      ORDER BY comments.root_id ASC, comments.id ASC
    `;
  },

  deleteComment: `
    WITH deleted_comment AS (
      DELETE FROM comments
      WHERE id = $1 AND user_id = $2
      RETURNING *
    )
    SELECT ${buildCommentSelectFragment(null, "deleted_comment")}
    FROM deleted_comment
    LEFT JOIN profiles ON profiles.user_id = deleted_comment.user_id;
  `,

  likeComment: `
    WITH target AS (
      SELECT id
      FROM comments
      WHERE id = $1
    ),
    inserted AS (
      INSERT INTO comment_likes (comment_id, user_id)
      SELECT id, $2
      FROM target
      ON CONFLICT (comment_id, user_id) DO NOTHING
      RETURNING comment_id
    ),
    updated AS (
      UPDATE comments
      SET likes_count = COALESCE(likes_count, 0) + 1
      WHERE id = $1
        AND EXISTS (SELECT 1 FROM inserted)
      RETURNING COALESCE(likes_count, 0) AS likes_count
    )
    SELECT
      EXISTS (SELECT 1 FROM target) AS found,
      true AS liked,
      COALESCE(
        (SELECT likes_count FROM updated),
        (SELECT COALESCE(likes_count, 0) FROM comments WHERE id = $1)
      ) AS likes_count;
  `,

  unlikeComment: `
    WITH target AS (
      SELECT id
      FROM comments
      WHERE id = $1
    ),
    deleted AS (
      DELETE FROM comment_likes
      WHERE comment_id = $1
        AND user_id = $2
      RETURNING comment_id
    ),
    updated AS (
      UPDATE comments
      SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0)
      WHERE id = $1
        AND EXISTS (SELECT 1 FROM deleted)
      RETURNING COALESCE(likes_count, 0) AS likes_count
    )
    SELECT
      EXISTS (SELECT 1 FROM target) AS found,
      false AS liked,
      COALESCE(
        (SELECT likes_count FROM updated),
        (SELECT COALESCE(likes_count, 0) FROM comments WHERE id = $1)
      ) AS likes_count;
  `,
};
