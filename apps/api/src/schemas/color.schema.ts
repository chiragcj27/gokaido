import { z } from "zod";

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase, alphanumeric, hyphen-separated");

const hexSchema = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, "Must be a 6-digit hex colour, e.g. #DC2626");

export const createColorSchema = z.object({
  name: z.string().trim().min(1).max(60),
  slug: slugSchema,
  hex: hexSchema,
  isActive: z.boolean().optional(),
});

export const updateColorSchema = createColorSchema.partial();

export const colorListQuerySchema = z.object({
  status: z.enum(["active", "inactive", "all"]).optional(),
});
