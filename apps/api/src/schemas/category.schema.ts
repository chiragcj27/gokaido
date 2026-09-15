import { z } from "zod";
import { isOwnPublicUrl } from "../services/s3.js";

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase, alphanumeric, hyphen-separated");

const imageSchema = z.string().url().refine(isOwnPublicUrl, "Must be an uploaded asset URL");

export const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: slugSchema,
  description: z.string().trim().max(2000).optional(),
  image: imageSchema.optional(),
  isActive: z.boolean().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export const categoryListQuerySchema = z.object({
  status: z.enum(["active", "inactive", "all"]).optional(),
});

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

export const createSubcategorySchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: slugSchema,
  description: z.string().trim().max(2000).optional(),
  image: imageSchema.optional(),
  category: objectIdSchema,
  isActive: z.boolean().optional(),
});

export const updateSubcategorySchema = createSubcategorySchema.partial();

export const subcategoryListQuerySchema = z.object({
  category: objectIdSchema.optional(),
  status: z.enum(["active", "inactive", "all"]).optional(),
});
