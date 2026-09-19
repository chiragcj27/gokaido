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

const sizeGuideMeasurementPointSchema = z.object({
  letter: z.string().trim().min(1).max(4),
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(400),
});

const sizeGuideRowSchema = z
  .object({
    size: z.string().trim().min(1).max(20),
    chestMinCm: z.number().positive(),
    chestMaxCm: z.number().positive(),
    lengthCm: z.number().positive(),
  })
  .refine((row) => row.chestMaxCm >= row.chestMinCm, {
    message: "Chest max must be greater than or equal to chest min",
    path: ["chestMaxCm"],
  });

export const sizeGuideSchema = z.object({
  title: z.string().trim().max(120).optional(),
  description: z.string().trim().max(600).optional(),
  measurementImage: imageSchema.optional(),
  measurementGuide: z.array(sizeGuideMeasurementPointSchema).max(6).optional(),
  sizeChart: z.array(sizeGuideRowSchema).max(20).optional(),
  footerNote: z.string().trim().max(600).optional(),
});

export const createSubcategorySchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: slugSchema,
  description: z.string().trim().max(2000).optional(),
  image: imageSchema.optional(),
  category: objectIdSchema,
  // null clears a previously-set custom guide, reverting the subcategory to
  // the storefront's default; undefined/omitted leaves it untouched.
  sizeGuide: sizeGuideSchema.nullable().optional(),
  isActive: z.boolean().optional(),
});

export const updateSubcategorySchema = createSubcategorySchema.partial();

export const subcategoryListQuerySchema = z.object({
  category: objectIdSchema.optional(),
  status: z.enum(["active", "inactive", "all"]).optional(),
});
