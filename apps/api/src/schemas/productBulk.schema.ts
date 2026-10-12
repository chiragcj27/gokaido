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
  materialAndPadding: z.string().trim().optional(),
  hygieneAndMaintenance: z.string().trim().optional(),
  protectionDescription: z.string().trim().optional(),
  protectionStat1Heading: z.string().trim().optional(),
  protectionStat1Subheading: z.string().trim().optional(),
  protectionStat1Percent: z.coerce.number().min(0).max(100).optional(),
  protectionStat2Heading: z.string().trim().optional(),
  protectionStat2Subheading: z.string().trim().optional(),
  protectionStat2Percent: z.coerce.number().min(0).max(100).optional(),
  protectionStat3Heading: z.string().trim().optional(),
  protectionStat3Subheading: z.string().trim().optional(),
  protectionStat3Percent: z.coerce.number().min(0).max(100).optional(),
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
  "materialAndPadding",
  "hygieneAndMaintenance",
  "protectionDescription",
  "protectionStat1Heading",
  "protectionStat1Subheading",
  "protectionStat1Percent",
  "protectionStat2Heading",
  "protectionStat2Subheading",
  "protectionStat2Percent",
  "protectionStat3Heading",
  "protectionStat3Subheading",
  "protectionStat3Percent",
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

type TemplateHeader = (typeof BULK_TEMPLATE_HEADERS)[number];

// Rows sharing a slug become one product. Colour photos only need to be
// filled in on that colour's first row — later size rows for the same
// colour can leave `variantImages` blank and inherit it (see
// `productBulk.controller.ts`'s `imagesByColor` grouping). Product-level
// fields (`description`, `materialAndPadding`, `hygieneAndMaintenance`, the
// `protection*` columns, `cardImage`, `competitorImage`, etc.) only need
// filling in once, on the product's first row — `cardImage` is the single
// photo used on product cards/thumbnails, separate from the
// `images`/`variantImages` gallery photos. Protection
// stats: up to 3, a blank heading skips that stat, percent is optional.
const EXAMPLE_ROWS: Partial<Record<TemplateHeader, string>>[] = [
  {
    slug: "karate-chest-guard",
    name: "Karate Chest Guard",
    sport: "karate",
    category: "Protective Gear",
    subcategory: "Chest Guards",
    productType: "equipment",
    description: "Lightweight chest guard for sparring and competition.",
    materialAndPadding: "High-density EVA foam with a PU outer shell.",
    hygieneAndMaintenance: "Wipe with a damp cloth after use and air dry. Do not machine wash.",
    protectionDescription: "Engineered to absorb impact across the chest and ribs without restricting movement.",
    protectionStat1Heading: "Coverage",
    protectionStat1Subheading: "Chest & ribs",
    protectionStat2Heading: "Impact level",
    protectionStat2Subheading: "Light to moderate (training contact)",
    protectionStat2Percent: "92",
    protectionStat3Heading: "Grade",
    protectionStat3Subheading: "Competition / Approved",
    protectionStat3Percent: "89",
    cardImage: "https://example.com/chest-guard-card.png",
    competitorImage: "https://example.com/competitor-chest-guard.jpg",
    tags: "chest guard,karate,sparring",
    isFeatured: "true",
    isNewArrival: "false",
    isBestseller: "true",
    sku: "KCG-RED-M",
    color: "Red",
    size: "M",
    stock: "25",
    basePrice: "1299",
    variantImages: "https://example.com/chest-guard-red-1.jpg,https://example.com/chest-guard-red-2.jpg",
  },
  {
    slug: "karate-chest-guard",
    sport: "karate",
    category: "Protective Gear",
    subcategory: "Chest Guards",
    productType: "equipment",
    sku: "KCG-RED-L",
    color: "Red",
    size: "L",
    stock: "18",
    basePrice: "1299",
  },
  {
    slug: "karate-chest-guard",
    sport: "karate",
    category: "Protective Gear",
    subcategory: "Chest Guards",
    productType: "equipment",
    sku: "KCG-BLU-M",
    color: "Blue",
    size: "M",
    stock: "20",
    basePrice: "1299",
    variantImages: "https://example.com/chest-guard-blue-1.jpg",
  },
];

export const BULK_TEMPLATE_EXAMPLE_ROWS = EXAMPLE_ROWS.map((row) =>
  BULK_TEMPLATE_HEADERS.map((header) => row[header] ?? "")
);
