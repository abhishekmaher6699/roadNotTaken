import { useState, useCallback } from "react";
import { Comment, CreateCommentInput, getCommentsForPinApi, createCommentApi, deleteCommentApi } from "./api";

export function useComments(pinId: number | null) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    if (!pinId) return;

    setLoading(true);
    setError(null);
    try {
      const data = await getCommentsForPinApi(pinId);
      setComments(data);
    } catch (err) {
      setError("Failed to load comments");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [pinId]);

  const addComment = useCallback(async (input: CreateCommentInput) => {
    // Optimistic update: add comment immediately
    const optimisticComment: Comment = {
      id: Date.now(), // Temporary ID
      pin_id: input.pin_id,
      parent_comment_id: input.parent_comment_id ?? null,
      user_id: '', // Will be set by server
      content: input.content,
      posted_by: 'You', // Temporary
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      isOptimistic: true,
    };

    setComments(prev => [...prev, optimisticComment]);

    try {
      const newComment = await createCommentApi(input);
      // Replace optimistic comment with real one
      setComments(prev => prev.map(c => c.id === optimisticComment.id ? newComment : c));
      return newComment;
    } catch (err) {
      // Revert optimistic update on error
      setComments(prev => prev.filter(c => c.id !== optimisticComment.id));
      setError("Failed to add comment");
      console.error(err);
      throw err;
    }
  }, []);

  const removeComment = useCallback(async (commentId: number) => {
    // Optimistic update: mark as deleting immediately
    setComments(prev => prev.map(c =>
      c.id === commentId ? { ...c, isDeleting: true } : c
    ));

    try {
      await deleteCommentApi(commentId);
      // Remove the comment
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err) {
      // Revert optimistic update on error
      setComments(prev => prev.map(c =>
        c.id === commentId ? { ...c, isDeleting: false } : c
      ));
      setError("Failed to delete comment");
      console.error(err);
      throw err;
    }
  }, []);

  return {
    comments,
    loading,
    error,
    fetchComments,
    addComment,
    removeComment,
  };
}