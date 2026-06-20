import type {
  ProfileFollowListInput,
  ProfileFollowListPage,
  ProfileFollowListUser,
} from "./profiles.types";

const DEFAULT_FOLLOW_LIST_LIMIT = 20;
const MAX_FOLLOW_LIST_LIMIT = 50;

interface FollowCursor {
  followed_at: string;
  user_id: string;
}

function encodeCursor(cursor: FollowCursor) {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

function decodeCursor(cursor?: string): FollowCursor | null {
  if (!cursor) return null;

  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));

    if (
      typeof parsed.followed_at === "string" &&
      typeof parsed.user_id === "string"
    ) {
      return parsed;
    }
  } catch {}

  return null;
}

export function prepareFollowListPage(input: ProfileFollowListInput = {}) {
  const limit = Math.min(
    Math.max(Number(input.limit) || DEFAULT_FOLLOW_LIST_LIMIT, 1),
    MAX_FOLLOW_LIST_LIMIT,
  );

  return {
    cursor: decodeCursor(input.cursor),
    limit,
  };
}

export function buildFollowListPage(
  users: ProfileFollowListUser[],
  limit: number,
): ProfileFollowListPage {
  const pageUsers = users.slice(0, limit);
  const hasMore = users.length > limit;
  const lastUser = pageUsers[pageUsers.length - 1];

  return {
    users: pageUsers,
    has_more: hasMore,
    next_cursor:
      hasMore && lastUser
        ? encodeCursor({
            followed_at: lastUser.followed_at,
            user_id: lastUser.user_id,
          })
        : null,
  };
}
