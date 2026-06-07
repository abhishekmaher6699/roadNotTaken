import { z } from "zod";

export const createCommentBodySchema = z.object({
  pin_id: z.coerce.number().int().positive(),
  parent_comment_id: z.coerce.number().int().positive().nullable().optional(),
  content: z.string().trim().min(1, "Comment content cannot be empty").max(1000),
}).strip();

export const commentPageQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
}).strip();
