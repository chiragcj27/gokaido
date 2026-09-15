import { z } from "zod";
import { isOwnPublicUrl } from "../services/s3.js";

export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

const mediaUrlSchema = z.string().url().refine(isOwnPublicUrl, "Must be an uploaded asset URL");

export const createReviewSchema = z.object({
  product: objectIdSchema,
  order: objectIdSchema,
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional(),
  body: z.string().trim().max(3000).optional(),
  mediaUrls: z.array(mediaUrlSchema).max(6).optional(),
});

export const reviewListQuerySchema = z.object({
  product: objectIdSchema,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  sort: z.enum(["newest", "helpful", "rating_high", "rating_low"]).default("newest"),
});

export const adminReviewListQuerySchema = z.object({
  product: objectIdSchema.optional(),
  status: z.enum(["pending", "approved", "rejected", "all"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const rejectReviewSchema = z.object({
  reason: z.string().trim().min(1).max(500).optional(),
});

// Admin-manual review entry — e.g. one collected over phone/WhatsApp rather
// than submitted through the storefront. No order is required; either an
// existing user or a freeform guest name identifies the reviewer.
export const createAdminReviewSchema = z
  .object({
    product: objectIdSchema,
    user: objectIdSchema.optional(),
    guestName: z.string().trim().min(1).max(100).optional(),
    rating: z.coerce.number().int().min(1).max(5),
    title: z.string().trim().max(120).optional(),
    body: z.string().trim().max(3000).optional(),
    mediaUrls: z.array(mediaUrlSchema).max(6).optional(),
    isVerifiedPurchase: z.boolean().optional(),
    status: z.enum(["pending", "approved", "rejected"]).optional(),
  })
  .refine((data) => data.user ?? data.guestName, {
    message: "Provide either an existing user id or a guest name",
    path: ["guestName"],
  });
