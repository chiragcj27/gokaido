import { z } from "zod";
import { isOwnPublicUrl } from "../services/s3.js";

const ownUrl = z.string().url().refine(isOwnPublicUrl, "Must be an uploaded asset URL");

/** One value per storefront language. English is the fallback for the others. */
const localized = (max: number) =>
  z.object({
    en: z.string().trim().max(max).optional(),
    hi: z.string().trim().max(max).optional(),
    mr: z.string().trim().max(max).optional(),
    ta: z.string().trim().max(max).optional(),
  });

const requireEnglish = (label: string, max: number) =>
  localized(max).refine((v) => !!v.en && v.en.length > 0, `${label} (English) is required`);

// Generous: a long post with lots of inline styling runs to a few hundred KB of HTML.
const MAX_CONTENT = 1_000_000;

export const createBlogPostSchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug may only contain lowercase letters, numbers and single hyphens"),
  title: requireEnglish("Title", 200),
  content: requireEnglish("Content", MAX_CONTENT),
  excerpt: localized(500).optional(),
  metaTitle: localized(120).optional(),
  metaDescription: localized(320).optional(),
  featuredImage: z.union([ownUrl, z.literal("")]).optional(),
  author: z.string().trim().min(1).max(80),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  sport: z.string().trim().max(40).optional(),
  isPublished: z.boolean().optional(),
  // ISO date; "" / null clears it (falls back to "now" when publishing).
  publishedAt: z.union([z.coerce.date(), z.literal(""), z.null()]).optional(),
});

export const updateBlogPostSchema = createBlogPostSchema.partial();

export type BlogPostInput = z.infer<typeof createBlogPostSchema>;
