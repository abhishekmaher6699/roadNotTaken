import { useCallback, useRef, useState, type SetStateAction } from "react";
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

const LIKE_FLUSH_DELAY_MS = 500;
const COMMENT_PAGE_LIMIT = 5;

interface PendingLikeMutation {
  baseComment: Comment;
  timer: ReturnType<typeof setTimeout>;
  controller: AbortController | null;
  resolve: (comment: Comment | null) => void;
}

export function useComments(pinId: number | null) {
  const [comments, setComments] = useState<Comment[]>([]);
  const commentsRef = useRef<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [commentCount, setCommentCount] = useState<number | null>(null);
  const likeControllersRef = useRef<Map<number, AbortController>>(new Map());
  const likeRequestIdsRef = useRef<Map<number, number>>(new Map());
  const pendingLikeMutationsRef = useRef<
    Map<number, PendingLikeMutation>
  >(new Map());

  const setSyncedComments = useCallback(
    (updater: SetStateAction<Comment[]>) => {
      const next =
        typeof updater === "function"
          ? (updater as (value: Comment[]) => Comment[])(commentsRef.current)
          : updater;

      commentsRef.current = next;
      setComments(next);
    },
    [],
  );

  const patchComment = useCallback(
    (commentId: number, updater: (comment: Comment) => Comment) => {
      setSyncedComments((prev) =>
        prev.map((comment) =>
          comment.id === commentId ? updater(comment) : comment,
        ),
      );
    },
    [setSyncedComments],
  );

  const clearPendingLike = useCallback((commentId: number) => {
    const pendingMutation = pendingLikeMutationsRef.current.get(commentId);
    if (!pendingMutation) return null;

    clearTimeout(pendingMutation.timer);
    pendingMutation.controller?.abort();
    pendingMutation.resolve(null);
    pendingLikeMutationsRef.current.delete(commentId);
    return pendingMutation;
  }, []);

  const fetchComments = useCallback(async () => {
    if (!pinId) return;

    setLoading(true);
    setError(null);
    try {
      const data = await getCommentsForPinApi(pinId, {
        limit: COMMENT_PAGE_LIMIT,
      });
      setSyncedComments(data.comments);
      setNextCursor(data.next_cursor);
      setHasMore(data.has_more);
      setCommentCount(data.comment_count);
    } catch (err) {
      setError("Failed to load comments");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [pinId, setSyncedComments]);

  const loadMoreComments = useCallback(async () => {
    if (!pinId || !nextCursor || loadingMore) return;

    setLoadingMore(true);
    setError(null);
    try {
      const data = await getCommentsForPinApi(pinId, {
        cursor: nextCursor,
        limit: COMMENT_PAGE_LIMIT,
      });

      setSyncedComments((prev) => {
        const commentsById = new Map(prev.map((comment) => [comment.id, comment]));
        data.comments.forEach((comment) => commentsById.set(comment.id, comment));
        return Array.from(commentsById.values());
      });
      setNextCursor(data.next_cursor);
      setHasMore(data.has_more);
      setCommentCount(data.comment_count);
    } catch (err) {
      setError("Failed to load more comments");
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, nextCursor, pinId, setSyncedComments]);

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

    setSyncedComments((prev) => [...prev, optimisticComment]);

    try {
      const newComment = await createCommentApi(input);
      setSyncedComments((prev) =>
        prev.map((c) => (c.id === optimisticComment.id ? newComment : c)),
      );
      setCommentCount((current) => (current == null ? current : current + 1));
      return newComment;
    } catch (err) {
      setSyncedComments((prev) =>
        prev.filter((c) => c.id !== optimisticComment.id),
      );
      setError("Failed to add comment");
      console.error(err);
      throw err;
    }
  }, [setSyncedComments]);

  const removeComment = useCallback(async (commentId: number) => {
    const removedIds = new Set<number>([commentId]);

    setSyncedComments((prev) => {
      const collectReplyIds = (parentId: number) => {
        prev.forEach((comment) => {
          if (
            comment.parent_comment_id === parentId &&
            !removedIds.has(comment.id)
          ) {
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
      setSyncedComments((prev) => prev.filter((c) => !removedIds.has(c.id)));
      setCommentCount((current) =>
        current == null ? current : Math.max(current - removedIds.size, 0),
      );
      return removedIds.size;
    } catch (err) {
      setSyncedComments((prev) =>
        prev.map((c) =>
          removedIds.has(c.id) ? { ...c, isDeleting: false } : c
        )
      );
      setError("Failed to delete comment");
      console.error(err);
      throw err;
    }
  }, [setSyncedComments]);

  const toggleLike = useCallback(async (commentId: number) => {
    const previousComment = commentsRef.current.find((c) => c.id === commentId);

    if (!previousComment) {
      return null;
    }

    const optimisticComment: Comment = {
      ...previousComment,
      viewer_has_liked: !previousComment.viewer_has_liked,
      likes_count: Math.max(
        previousComment.likes_count +
          (previousComment.viewer_has_liked ? -1 : 1),
        0,
      ),
    };

    patchComment(commentId, () => optimisticComment);

    const pendingMutation = clearPendingLike(commentId);
    if (pendingMutation) {
      if (
        !pendingMutation.controller &&
        optimisticComment.viewer_has_liked === pendingMutation.baseComment.viewer_has_liked
      ) {
        return optimisticComment;
      }
    }

    const requestId = (likeRequestIdsRef.current.get(commentId) ?? 0) + 1;
    likeRequestIdsRef.current.set(commentId, requestId);

    return new Promise<Comment | null>((resolve, reject) => {
      const timer = setTimeout(async () => {
        const controller = new AbortController();
        likeControllersRef.current.set(commentId, controller);

        const currentMutation = pendingLikeMutationsRef.current.get(commentId);
        if (currentMutation) {
          currentMutation.controller = controller;
        }

        try {
          const result = optimisticComment.viewer_has_liked
            ? await likeCommentApi(commentId, controller.signal)
            : await unlikeCommentApi(commentId, controller.signal);

          if (likeRequestIdsRef.current.get(commentId) !== requestId) {
            resolve(null);
            return;
          }

          const resolvedComment: Comment = {
            ...optimisticComment,
            viewer_has_liked: result.liked,
            likes_count: result.likes_count,
          };

          patchComment(commentId, () => resolvedComment);
          resolve(resolvedComment);
        } catch (err) {
          if (isAbortError(err)) {
            resolve(null);
            return;
          }

          if (likeRequestIdsRef.current.get(commentId) === requestId) {
            patchComment(commentId, () => previousComment);
            setError("Failed to update comment like");
          }

          reject(err);
        } finally {
          if (likeRequestIdsRef.current.get(commentId) === requestId) {
            likeControllersRef.current.delete(commentId);
            pendingLikeMutationsRef.current.delete(commentId);
          }
        }
      }, LIKE_FLUSH_DELAY_MS);

      pendingLikeMutationsRef.current.set(commentId, {
        baseComment: pendingMutation?.baseComment ?? previousComment,
        timer,
        controller: null,
        resolve,
      });
    });
  }, [clearPendingLike, patchComment]);

  return {
    comments,
    loading,
    loadingMore,
    error,
    hasMore,
    commentCount,
    fetchComments,
    loadMoreComments,
    addComment,
    removeComment,
    toggleLike,
  };
}
