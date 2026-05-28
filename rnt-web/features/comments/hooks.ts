import { useCallback, useRef, useState } from "react";
import {
  Comment,
  CreateCommentInput,
  createCommentApi,
  deleteCommentApi,
  getCommentsForPinApi,
  likeCommentApi,
  unlikeCommentApi,
} from "./api";

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}

export function useComments(pinId: number | null) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const likeControllersRef = useRef<Map<number, AbortController>>(new Map());
  const likeRequestIdsRef = useRef<Map<number, number>>(new Map());

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

  const addComment = useCallback(async (
    input: CreateCommentInput,
    optimisticAuthor?: { id?: string; postedBy?: string },
  ) => {
    const optimisticComment: Comment = {
      id: Date.now(),
      pin_id: input.pin_id,
      parent_comment_id: input.parent_comment_id ?? null,
      user_id: optimisticAuthor?.id ?? "",
      content: input.content,
      posted_by: optimisticAuthor?.postedBy ?? "Anonymous",
      likes_count: 0,
      viewer_has_liked: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      isOptimistic: true,
    };

    setComments((prev) => [...prev, optimisticComment]);

    try {
      const newComment = await createCommentApi(input);
      setComments((prev) =>
        prev.map((c) => (c.id === optimisticComment.id ? newComment : c))
      );
      return newComment;
    } catch (err) {
      setComments((prev) => prev.filter((c) => c.id !== optimisticComment.id));
      setError("Failed to add comment");
      console.error(err);
      throw err;
    }
  }, []);

  const removeComment = useCallback(async (commentId: number) => {
    const removedIds = new Set<number>([commentId]);

    setComments((prev) => {
      const collectReplyIds = (parentId: number) => {
        prev.forEach((comment) => {
          if (comment.parent_comment_id === parentId && !removedIds.has(comment.id)) {
            removedIds.add(comment.id);
            collectReplyIds(comment.id);
          }
        });
      };

      collectReplyIds(commentId);

      return prev.map((c) =>
        removedIds.has(c.id) ? { ...c, isDeleting: true } : c
      );
    });

    try {
      await deleteCommentApi(commentId);
      setComments((prev) => prev.filter((c) => !removedIds.has(c.id)));
      return removedIds.size;
    } catch (err) {
      setComments((prev) =>
        prev.map((c) =>
          removedIds.has(c.id) ? { ...c, isDeleting: false } : c
        )
      );
      setError("Failed to delete comment");
      console.error(err);
      throw err;
    }
  }, []);

  const toggleLike = useCallback(async (commentId: number) => {
    likeControllersRef.current.get(commentId)?.abort();

    let previousComment: Comment | undefined;
    let optimisticComment: Comment | undefined;

    setComments((prev) => {
      previousComment = prev.find((c) => c.id === commentId);
      if (!previousComment) {
        return prev;
      }

      optimisticComment = {
        ...previousComment,
        viewer_has_liked: !previousComment.viewer_has_liked,
        likes_count: Math.max(
          previousComment.likes_count +
            (previousComment.viewer_has_liked ? -1 : 1),
          0
        ),
        isLikePending: true,
      };

      return prev.map((c) =>
        c.id === commentId ? optimisticComment! : c
      );
    });

    if (!previousComment || !optimisticComment) {
      return;
    }

    const requestId = (likeRequestIdsRef.current.get(commentId) ?? 0) + 1;
    likeRequestIdsRef.current.set(commentId, requestId);
    const controller = new AbortController();
    likeControllersRef.current.set(commentId, controller);

    try {
      const result = optimisticComment.viewer_has_liked
        ? await likeCommentApi(commentId, controller.signal)
        : await unlikeCommentApi(commentId, controller.signal);

      if (likeRequestIdsRef.current.get(commentId) !== requestId) {
        return;
      }

      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? {
                ...c,
                viewer_has_liked: result.liked,
                likes_count: result.likes_count,
                isLikePending: false,
              }
            : c
        )
      );
    } catch (err) {
      if (isAbortError(err)) {
        return;
      }

      if (likeRequestIdsRef.current.get(commentId) !== requestId) {
        return;
      }

      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? {
                ...previousComment!,
                isLikePending: false,
              }
            : c
        )
      );
      setError("Failed to update comment like");
      console.error(err);
      throw err;
    } finally {
      if (likeRequestIdsRef.current.get(commentId) === requestId) {
        likeControllersRef.current.delete(commentId);
      }
    }
  }, []);

  return {
    comments,
    loading,
    error,
    fetchComments,
    addComment,
    removeComment,
    toggleLike,
  };
}
