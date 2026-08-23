import { z } from "zod";

export const sportSchema = z.enum(["karate", "taekwondo", "kickboxing", "boxing", "mma"]);
export const productTypeSchema = z.enum(["uniform", "equipment"]);
export const sortSchema = z.enum([
  "newest",
  "price_asc",
  "price_desc",
  "rating",
  "bestselling",
  "relevance",
]);

export const productListQuerySchema = z.object({
  sport: sportSchema.optional(),
  category: z.string().trim().optional(),
  subcategory: z.string().trim().optional(),
  productType: productTypeSchema.optional(),
  size: z.string().trim().optional(),
  color: z.string().trim().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  search: z.string().trim().min(1).optional(),
  sort: sortSchema.default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  region: z.string().trim().optional(),
  featured: z.coerce.boolean().optional(),
  newArrival: z.coerce.boolean().optional(),
  bestseller: z.coerce.boolean().optional(),
  // Only honored for admin/superadmin callers — see listProducts. Public
  // listings always see active-only regardless of this value.
  status: z.enum(["active", "inactive", "all"]).optional(),
});

export const productDetailQuerySchema = z.object({
  region: z.string().trim().optional(),
});

// No `.default()` on optional fields here: this schema backs both create (full
// document, where Mongoose's own schema defaults apply to omitted keys) and
// update (`.partial()` in updateProductSchema below), where a default would
// otherwise clobber an existing value the request simply didn't mention.
const variantInputSchema = z.object({
  sku: z.string().trim().min(1),
  color: z.string().trim().min(1),
  size: z.string().trim().min(1),
  stock: z.coerce.number().int().min(0).optional(),
  basePrice: z.coerce.number().min(0),
  regionPrices: z.record(z.string(), z.coerce.number().min(0)).optional(),
  images: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export const createProductSchema = z.object({
  name: z.string().trim().min(1).max(200),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase, alphanumeric, hyphen-separated"),
  sport: sportSchema,
  category: z.string().trim().min(1),
  subcategory: z.string().trim().optional(),
  productType: productTypeSchema,

  description: z.string().trim().optional(),
  images: z.array(z.string()).optional(),
  videos: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),

  variants: z.array(variantInputSchema).min(1, "At least one variant is required"),
  certifications: z.array(z.string()).optional(),

  fabric: z.string().trim().optional(),
  fabricCare: z.string().trim().optional(),
  qualityFeatures: z.string().trim().optional(),
  benefit: z.string().trim().optional(),

  ageGroup: z.string().trim().optional(),
  skillLevel: z.string().trim().optional(),
  soldAs: z.string().trim().optional(),
  protectionLevel: z.string().trim().optional(),
  materialAndPadding: z.string().trim().optional(),
  hygieneAndMaintenance: z.string().trim().optional(),
  replacementInterval: z.string().trim().optional(),
  safetyOutcome: z.string().trim().optional(),
  legalDisclaimer: z.string().trim().optional(),

  metaTitle: z.string().trim().optional(),
  metaDescription: z.string().trim().optional(),

  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isNewArrival: z.boolean().optional(),
  isBestseller: z.boolean().optional(),
});

export const updateProductSchema = createProductSchema.partial();
