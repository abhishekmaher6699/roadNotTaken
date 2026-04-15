import { apiClient } from "./api-client";

export interface Comment {
  id: number;
  pin_id: number;
  parent_comment_id?: number | null;
  user_id: string;
  content: string;
  posted_by?: string;
  created_at: string;
  updated_at: string;
  isOptimistic?: boolean; // For optimistic updates
  isDeleting?: boolean; // For delete in progress
}

export interface CreateCommentInput {
  pin_id: number;
  parent_comment_id?: number | null;
  content: string;
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