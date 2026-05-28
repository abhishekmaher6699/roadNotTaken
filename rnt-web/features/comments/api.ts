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
    email?: string | null;
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

export function getCommentsForPinApi(pinId: number) {
  return apiClient(`/comments/pins/${pinId}/comments`) as Promise<Comment[]>;
}

export function createCommentApi(data: CreateCommentInput) {
  return apiClient("/comments", {
    method: "POST",
    body: JSON.stringify(data),
  }) as Promise<Comment>;
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
