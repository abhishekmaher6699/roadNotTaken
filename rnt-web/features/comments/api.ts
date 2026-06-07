import { createAsyncCache } from "../../lib/async-cache";
import { apiClient } from "../../lib/api-client";

export interface Comment {
  id: number;
  pin_id: number;
  parent_comment_id?: number | null;
  user_id: string;
  content: string;
  posted_by?: string;
  author?: {
    id: string;
    display_name?: string | null;
    username?: string | null;
    avatar_url?: string | null;
  } | null;
  likes_count: number;
  viewer_has_liked: boolean;
  created_at: string;
  updated_at: string;
  isOptimistic?: boolean; // For optimistic updates
  isDeleting?: boolean; // For delete in progress
  isLikePending?: boolean;
}

export interface CreateCommentInput {
  pin_id: number;
  parent_comment_id?: number | null;
  content: string;
}

export interface CommentLikeMutationResponse {
  liked: boolean;
  likes_count: number;
}

export interface CommentPageResponse {
  comments: Comment[];
  next_cursor: string | null;
  has_more: boolean;
  comment_count: number;
}

const COMMENT_PAGE_CACHE_TTL_MS = 15_000;
const commentPageCache = createAsyncCache<CommentPageResponse>(
  COMMENT_PAGE_CACHE_TTL_MS,
);

function getCommentPageCacheKey(
  pinId: number,
  options: { cursor?: string | null; limit?: number },
) {
  return `${pinId}:${options.cursor ?? ""}:${options.limit ?? ""}`;
}

export function invalidateCommentsForPin(pinId: number) {
  commentPageCache.deleteByPrefix(`${pinId}:`);
}

export function getCommentsForPinApi(
  pinId: number,
  options: { cursor?: string | null; limit?: number } = {},
) {
  const cacheKey = getCommentPageCacheKey(pinId, options);

  const params = new URLSearchParams();

  if (options.cursor) {
    params.set("cursor", options.cursor);
  }

  if (options.limit) {
    params.set("limit", String(options.limit));
  }

  const query = params.toString();
  const path = `/comments/pins/${pinId}/comments${query ? `?${query}` : ""}`;

  return commentPageCache.get(cacheKey, () =>
    apiClient(path) as Promise<CommentPageResponse>,
  );
}

export async function createCommentApi(data: CreateCommentInput) {
  const comment = (await apiClient("/comments", {
    method: "POST",
    body: JSON.stringify(data),
  })) as Comment;

  invalidateCommentsForPin(data.pin_id);
  return comment;
}

export function deleteCommentApi(id: number) {
  return apiClient(`/comments/${id}`, {
    method: "DELETE",
  }) as Promise<{ id: number }>;
}

export function likeCommentApi(id: number, signal?: AbortSignal) {
  return apiClient(`/comments/${id}/like`, {
    method: "POST",
    signal,
  }) as Promise<CommentLikeMutationResponse>;
}

export function unlikeCommentApi(id: number, signal?: AbortSignal) {
  return apiClient(`/comments/${id}/like`, {
    method: "DELETE",
    signal,
  }) as Promise<CommentLikeMutationResponse>;
}
