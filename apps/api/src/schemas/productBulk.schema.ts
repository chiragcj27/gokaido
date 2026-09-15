import { z } from "zod";
import { sportSchema, productTypeSchema } from "./product.schema.js";

// One row = one variant. Rows sharing the same `slug` are grouped into a
// single product with multiple variants when the sheet is processed.
const yesNo = z
  .union([z.boolean(), z.string()])
  .transform((v) => (typeof v === "boolean" ? v : ["true", "yes", "y", "1"].includes(v.trim().toLowerCase())))
  .optional();

const csv = (value: string | undefined) =>
  value
    ? value
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean)
    : [];

export const bulkProductRowSchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase, alphanumeric, hyphen-separated"),
  name: z.string().trim().min(1).optional(),
  sport: sportSchema,
  category: z.string().trim().min(1),
  subcategory: z.string().trim().optional(),
  productType: productTypeSchema,
  description: z.string().trim().optional(),
  images: z.string().trim().optional(),
  tags: z.string().trim().optional(),
  isFeatured: yesNo,
  isNewArrival: yesNo,
  isBestseller: yesNo,
  sku: z.string().trim().min(1),
  color: z.string().trim().min(1),
  size: z.string().trim().min(1),
  stock: z.coerce.number().int().min(0),
  basePrice: z.coerce.number().min(0),
  variantImages: z.string().trim().optional(),
});

export type BulkProductRow = z.infer<typeof bulkProductRowSchema>;

export { csv as splitCsv };

export const BULK_TEMPLATE_HEADERS = [
  "slug",
  "name",
  "sport",
  "category",
  "subcategory",
  "productType",
  "description",
  "images",
  "tags",
  "isFeatured",
  "isNewArrival",
  "isBestseller",
  "sku",
  "color",
  "size",
  "stock",
  "basePrice",
  "variantImages",
] as const;

export const BULK_TEMPLATE_EXAMPLE_ROW = [
  "karate-gi-classic",
  "Karate Gi Classic",
  "karate",
  "Uniforms",
  "Gi",
  "uniform",
  "Lightweight training gi for daily practice.",
  "",
  "gi,karate,training",
  "yes",
  "",
  "",
  "KG-CLS-RED-M",
  "Red",
  "M",
  "25",
  "1299",
  "",
];
