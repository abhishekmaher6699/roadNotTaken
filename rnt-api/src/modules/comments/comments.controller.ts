import { Request, Response } from 'express';
import { getOptionalAuthenticatedUser } from '../../middleware/auth.middleware';
import { CommentsServiceError, createComment, deleteCommentById, getCommentsForPin, likeCommentById, unlikeCommentById } from './comments.service';

export async function createCommentHandler(req: any, res: Response) {
  try {
    const user = req.user;
    const { pin_id, content, parent_comment_id } = req.body;

    if (pin_id == null || typeof content !== "string") {
      return res.status(400).json({ error: 'pin_id and content are required' });
    }

    const parsedPinId = parseInt(pin_id as string, 10);

    if (isNaN(parsedPinId)) {
      return res.status(400).json({ error: 'Invalid pin_id' });
    }

    let parentCommentId: number | null = null;

    if (parent_comment_id != null) {
      const parsed = parseInt(parent_comment_id as string, 10);
      if (isNaN(parsed)) {
        return res.status(400).json({ error: 'Invalid parent_comment_id' });
      }
      parentCommentId = parsed;
    }

    const comment = await createComment({
      pin_id: parsedPinId,
      content,
      parent_comment_id: parentCommentId,
      posted_by: undefined,
      user_id: user.id,
    });

    res.status(201).json(comment);
  } catch (error) {
    if (error instanceof CommentsServiceError) {
      return res.status(error.status).json({ error: error.message });
    }

    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
}

export async function getCommentsForPinHandler(req: Request, res: Response) {
  try {
    const pinId = parseInt(req.params.pinId as string);

    if (isNaN(pinId)) {
      return res.status(400).json({ error: 'Invalid pin ID' });
    }

    const user = await getOptionalAuthenticatedUser(req);
    const comments = await getCommentsForPin(pinId, user?.id);
    res.json(comments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
}

export async function deleteCommentHandler(req: any, res: Response) {
  try {
    const user = req.user;
    const commentId = parseInt(req.params.id as string);

    if (isNaN(commentId)) {
      return res.status(400).json({ error: 'Invalid comment ID' });
    }

    const deletedComment = await deleteCommentById(commentId, user.id);

    if (!deletedComment) {
      return res.status(404).json({ error: 'Comment not found or not owned by user' });
    }

    res.json({ id: commentId });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
}

export async function likeCommentHandler(req: any, res: Response) {
  try {
    const commentId = parseInt(req.params.id as string, 10);

    if (isNaN(commentId)) {
      return res.status(400).json({ error: 'Invalid comment ID' });
    }

    const result = await likeCommentById(commentId, req.user.id);

    if (!result) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Like comment error:', error);
    return res.status(500).json({ error: 'Failed to like comment' });
  }
}

export async function unlikeCommentHandler(req: any, res: Response) {
  try {
    const commentId = parseInt(req.params.id as string, 10);

    if (isNaN(commentId)) {
      return res.status(400).json({ error: 'Invalid comment ID' });
    }

    const result = await unlikeCommentById(commentId, req.user.id);

    if (!result) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Unlike comment error:', error);
    return res.status(500).json({ error: 'Failed to unlike comment' });
  }
}
