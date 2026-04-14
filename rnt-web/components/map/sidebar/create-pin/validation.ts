import { z } from "zod";

export const createPinSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  category: z.string().trim().min(1, "Category is required"),
  description: z.string().trim().optional(),
  imageUrls: z
    .array(z.url("Uploaded image URL is invalid"))
    .max(10, "You can upload at most 10 images"),
  thumbnailIndex: z
    .number()
    .int()
    .min(0, "Choose a thumbnail")
    .optional(),
});

export type CreatePinFormValues = z.infer<typeof createPinSchema>;
