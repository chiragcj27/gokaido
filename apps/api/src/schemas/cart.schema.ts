import { z } from "zod";

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid product id");

export const addItemSchema = z.object({
  productId: objectIdSchema,
  variantSku: z.string().trim().min(1),
  quantity: z.coerce.number().int().min(1).max(20),
  region: z.string().trim().optional(),
});

export const updateItemSchema = z.object({
  quantity: z.coerce.number().int().min(0).max(20),
});

export const mergeCartSchema = z.object({
  guestId: z.string().trim().min(1),
});
