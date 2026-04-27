export interface Comment {
  id: number;
  pin_id: number;
  parent_comment_id?: number | null;
  user_id: string;
  content: string;
  posted_by?: string;
  likes_count: number;
  viewer_has_liked: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCommentInput {
  pin_id: number;
  parent_comment_id: number | null;
  content: string;
  posted_by?: string;
}

export interface GetCommentsForPinInput {
  pin_id: number;
}

export interface CommentLikeMutationResult {
  liked: boolean;
  likes_count: number;
}
