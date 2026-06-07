import { z } from "zod";

const optionalText = z.string().trim().min(1).max(500).optional();
const optionalLongText = z.string().trim().max(5000).optional().nullable();
const imageUrl = z.string().url().max(2000);

const pinBaseSchema = z.object({
  title: z.string().trim().min(1).max(160),
  category: optionalText,
  address: z.string().trim().max(500).optional().nullable(),
  status: z.string().trim().max(60).optional(),
  access_level: z.string().trim().max(60).optional(),
  description: optionalLongText,
  thumbnail_url: imageUrl.optional().nullable(),
  image_urls: z.array(imageUrl).max(10).optional(),
});

export const createPinBodySchema = pinBaseSchema.extend({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
}).strip();

export const updatePinBodySchema = pinBaseSchema.strip();

const tileSchema = z.object({
  x: z.coerce.number().int().nonnegative(),
  y: z.coerce.number().int().nonnegative(),
  z: z.coerce.number().int().min(0).max(22),
});

export const tileQueryBodySchema = z.object({
  tiles: z.array(tileSchema).max(128),
}).strip();

export const summaryTileQueryBodySchema = z.object({
  tiles: z.array(tileSchema).max(512),
}).strip();

export const pinListQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
}).strip();

export const searchPinsQuerySchema = z.object({
  q: z.string().trim().max(120).optional().default(""),
  limit: z.coerce.number().int().positive().max(100).optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
}).strip();
