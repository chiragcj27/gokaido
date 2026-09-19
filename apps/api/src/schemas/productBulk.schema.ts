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
  cardImage: z.string().trim().url().optional(),
  competitorImage: z.string().trim().url().optional(),
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
  "cardImage",
  "competitorImage",
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

// Rows sharing a slug become one product. Colour photos only need to be
// filled in on that colour's first row — later size rows for the same
// colour can leave `variantImages` blank and inherit it (see
// `productBulk.controller.ts`'s `imagesByColor` grouping). `cardImage` and
// `competitorImage` are product-level (not per-colour), so they only need
// filling in once too, on the product's first row — `cardImage` must be a
// background-removed cutout, unlike `images`/`variantImages`, which may have
// a background.
export const BULK_TEMPLATE_EXAMPLE_ROWS = [
  [
    "karate-gi-classic",
    "Karate Gi Classic",
    "karate",
    "Uniforms",
    "Gi",
    "uniform",
    "Lightweight training gi for daily practice.",
    "",
    "https://example.com/gi-card.png",
    "https://example.com/competitor-gi.jpg",
    "gi,karate,training",
    "yes",
    "",
    "",
    "KG-CLS-RED-M",
    "Red",
    "M",
    "25",
    "1299",
    "https://example.com/gi-red-1.jpg,https://example.com/gi-red-2.jpg",
  ],
  [
    "karate-gi-classic",
    "",
    "karate",
    "Uniforms",
    "Gi",
    "uniform",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "KG-CLS-RED-L",
    "Red",
    "L",
    "18",
    "1299",
    "",
  ],
  [
    "karate-gi-classic",
    "",
    "karate",
    "Uniforms",
    "Gi",
    "uniform",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "KG-CLS-BLU-M",
    "Blue",
    "M",
    "20",
    "1299",
    "https://example.com/gi-blue-1.jpg",
  ],
];
