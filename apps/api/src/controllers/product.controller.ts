import type { Request, Response } from "express";
import { Product, mongoose } from "@gokaido/database";
import {
  productListQuerySchema,
  productDetailQuerySchema,
  createProductSchema,
  updateProductSchema,
} from "../schemas/product.schema.js";
import { getEffectivePrice } from "../utils/pricing.js";

export type LeanVariant = {
  sku: string;
  color: string;
  size: string;
  stock: number;
  basePrice: number;
  regionPrices?: Record<string, number>;
  images: string[];
  isActive: boolean;
};

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function withEffectivePrice(variant: LeanVariant, region?: string) {
  const { regionPrices, ...rest } = variant;
  return { ...rest, effectivePrice: getEffectivePrice(variant, region) };
}

type ListQuery = ReturnType<typeof productListQuerySchema.parse>;

function buildMatch(query: ListQuery, canSeeInactive: boolean) {
  const match: Record<string, unknown> = {};
  const status = canSeeInactive ? (query.status ?? "active") : "active";
  if (status === "active") match.isActive = true;
  else if (status === "inactive") match.isActive = false;
  // status === "all" -> no isActive filter

  if (query.sport) match.sport = query.sport;
  if (query.category) match.category = query.category;
  if (query.subcategory) match.subcategory = query.subcategory;
  if (query.productType) match.productType = query.productType;
  if (query.featured !== undefined) match.isFeatured = query.featured;
  if (query.newArrival !== undefined) match.isNewArrival = query.newArrival;
  if (query.bestseller !== undefined) match.isBestseller = query.bestseller;

  const variantElemMatch: Record<string, unknown> = {};
  if (query.color) {
    variantElemMatch.color = new RegExp(`^${escapeRegex(query.color)}$`, "i");
  }
  if (query.size) {
    variantElemMatch.size = new RegExp(`^${escapeRegex(query.size)}$`, "i");
  }
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    const priceRange: Record<string, number> = {};
    if (query.minPrice !== undefined) priceRange.$gte = query.minPrice;
    if (query.maxPrice !== undefined) priceRange.$lte = query.maxPrice;
    variantElemMatch.basePrice = priceRange;
  }
  if (Object.keys(variantElemMatch).length > 0) {
    match.variants = { $elemMatch: variantElemMatch };
  }

  if (query.search) {
    match.$text = { $search: query.search };
  }

  return match;
}

function buildSort(
  sort: ListQuery["sort"],
  hasSearch: boolean
): Record<string, 1 | -1 | { $meta: "textScore" }> {
  switch (sort) {
    case "price_asc":
      return { minPrice: 1 };
    case "price_desc":
      return { minPrice: -1 };
    case "rating":
      return { avgRating: -1 };
    case "bestselling":
      return { reviewCount: -1 };
    case "relevance":
      return hasSearch ? { score: { $meta: "textScore" } } : { createdAt: -1 };
    case "newest":
    default:
      return { createdAt: -1 };
  }
}

export async function listProducts(req: Request, res: Response): Promise<void> {
  const parsed = productListQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid query" });
    return;
  }

  const query = parsed.data;
  const canSeeInactive = req.user?.role === "admin" || req.user?.role === "superadmin";
  const match = buildMatch(query, canSeeInactive);
  const hasSearch = Boolean(query.search);

  const pipeline: mongoose.PipelineStage[] = [{ $match: match }];
  if (hasSearch) {
    pipeline.push({ $addFields: { score: { $meta: "textScore" } } });
  }
  pipeline.push({ $addFields: { minPrice: { $min: "$variants.basePrice" } } });
  pipeline.push({ $sort: buildSort(query.sort, hasSearch) });
  pipeline.push({
    $facet: {
      data: [{ $skip: (query.page - 1) * query.limit }, { $limit: query.limit }],
      totalCount: [{ $count: "count" }],
    },
  });

  type FacetResult = {
    data: Array<Record<string, unknown> & { variants: LeanVariant[] }>;
    totalCount: Array<{ count: number }>;
  };
  const [result] = (await Product.aggregate(pipeline)) as FacetResult[];

  const products = result?.data ?? [];
  const total = result?.totalCount?.[0]?.count ?? 0;

  res.json({
    products: products.map((p) => ({
      ...p,
      variants: p.variants.map((v) => withEffectivePrice(v, query.region)),
    })),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  });
}

export async function getProductBySlug(req: Request, res: Response): Promise<void> {
  const parsed = productDetailQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query" });
    return;
  }

  const product = (await Product.findOne({ slug: req.params.slug, isActive: true }).lean()) as
    | (Record<string, unknown> & { variants: LeanVariant[] })
    | null;
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json({
    product: {
      ...product,
      variants: product.variants.map((v) => withEffectivePrice(v, parsed.data.region)),
    },
  });
}

export async function createProduct(req: Request, res: Response): Promise<void> {
  const parsed = createProductSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid product data" });
    return;
  }

  if (await Product.exists({ slug: parsed.data.slug })) {
    res.status(409).json({ error: "A product with this slug already exists" });
    return;
  }

  const product = await Product.create(parsed.data);
  res.status(201).json({ product });
}

export async function updateProduct(req: Request, res: Response): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400).json({ error: "Invalid product id" });
    return;
  }

  const parsed = updateProductSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid product data" });
    return;
  }

  if (parsed.data.slug && (await Product.exists({ slug: parsed.data.slug, _id: { $ne: req.params.id } }))) {
    res.status(409).json({ error: "A product with this slug already exists" });
    return;
  }

  const product = await Product.findByIdAndUpdate(req.params.id, parsed.data, { new: true });
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json({ product });
}

export async function deleteProduct(req: Request, res: Response): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400).json({ error: "Invalid product id" });
    return;
  }

  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json({ product });
}
