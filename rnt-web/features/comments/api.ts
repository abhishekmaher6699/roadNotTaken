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

const commentPageCache = new Map<
  string,
  {
    data: CommentPageResponse;
    expiresAt: number;
  }
>();
const commentPageRequests = new Map<string, Promise<CommentPageResponse>>();

function getCommentPageCacheKey(
  pinId: number,
  options: { cursor?: string | null; limit?: number },
) {
  return `${pinId}:${options.cursor ?? ""}:${options.limit ?? ""}`;
}

export function invalidateCommentsForPin(pinId: number) {
  const prefix = `${pinId}:`;

  for (const key of commentPageCache.keys()) {
    if (key.startsWith(prefix)) {
      commentPageCache.delete(key);
    }
  }

  for (const key of commentPageRequests.keys()) {
    if (key.startsWith(prefix)) {
      commentPageRequests.delete(key);
    }
  }
}

export function getCommentsForPinApi(
  pinId: number,
  options: { cursor?: string | null; limit?: number } = {},
) {
  const cacheKey = getCommentPageCacheKey(pinId, options);
  const cached = commentPageCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return Promise.resolve(cached.data);
  }

  const activeRequest = commentPageRequests.get(cacheKey);
  if (activeRequest) {
    return activeRequest;
  }

  const params = new URLSearchParams();

  if (options.cursor) {
    params.set("cursor", options.cursor);
  }

  if (options.limit) {
    params.set("limit", String(options.limit));
  }

  const query = params.toString();
  const path = `/comments/pins/${pinId}/comments${query ? `?${query}` : ""}`;

  const request = (apiClient(path) as Promise<CommentPageResponse>)
    .then((data) => {
      commentPageCache.set(cacheKey, {
        data,
        expiresAt: Date.now() + COMMENT_PAGE_CACHE_TTL_MS,
      });
      return data;
    })
    .finally(() => {
      commentPageRequests.delete(cacheKey);
    });

  commentPageRequests.set(cacheKey, request);
  return request;
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
