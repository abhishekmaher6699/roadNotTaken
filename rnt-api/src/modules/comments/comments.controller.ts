import { Request, Response } from 'express';
import { getOptionalAuthenticatedUser } from '../../middleware/auth.middleware';
import { createComment, deleteCommentById, getCommentsForPin, likeCommentById, unlikeCommentById } from './comments.service';

export async function createCommentHandler(req: any, res: Response) {
  try {
    const user = req.user;
    const { pin_id, content, parent_comment_id } = req.body;

    // console.log('Create comment request:', { pin_id, content, parent_comment_id, userId: user?.id, userEmail: user?.email });

    if (!pin_id || !content) {
      return res.status(400).json({ error: 'pin_id and content are required' });
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
      pin_id,
      content,
      parent_comment_id: parentCommentId,
      posted_by: user.email ?? req.body.posted_by,
      user_id: user.id,
    });

    // console.log('Comment created:', comment);
    res.status(201).json(comment);
  } catch (error) {
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

    // console.log('Delete comment request:', { commentId, userId: user?.id });

    const deletedComment = await deleteCommentById(commentId, user.id);

    if (!deletedComment) {
      // console.log('Comment not found or not owned by user');
      return res.status(404).json({ error: 'Comment not found or not owned by user' });
    }

    // console.log('Comment deleted successfully:', deletedComment);
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
