import type { Request, Response } from "express";
import { Product, Subcategory, mongoose } from "@gokaido/database";
import type { ISizeGuide } from "@gokaido/database";
import {
  productListQuerySchema,
  productDetailQuerySchema,
  productSuggestQuerySchema,
  createProductSchema,
  updateProductSchema,
} from "../schemas/product.schema.js";
import { getEffectivePrice } from "../utils/pricing.js";
import { escapeRegex } from "../utils/regex.js";
import {
  invalidateVectorIndex,
  searchProductIds,
  suggestProducts,
  type SearchInterpretation,
} from "../services/productSearch.js";
import { refreshProductEmbeddings } from "../services/productEmbedding.js";

export type LeanVariant = {
  sku: string;
  color: string;
  size: string;
  stock: number;
  basePrice: number;
  mrp?: number;
  regionPrices?: Record<string, number>;
  images: string[];
  isActive: boolean;
};

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

  return match;
}

// Filters the search LLM read out of the query ("under 1500" → maxPrice),
// only where the request didn't set that filter itself — an explicit UI
// filter always wins over an inferred one.
function inferredFilters(interpretation: SearchInterpretation | null, query: ListQuery): Partial<ListQuery> {
  if (!interpretation) return {};
  const keys = ["sport", "category", "subcategory", "productType", "color", "size", "minPrice", "maxPrice"] as const;
  const filters: Record<string, unknown> = {};
  for (const key of keys) {
    if (query[key] === undefined && interpretation[key] !== null) filters[key] = interpretation[key];
  }
  return filters as Partial<ListQuery>;
}

function buildSort(sort: ListQuery["sort"], hasSearch: boolean): Record<string, 1 | -1> {
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
      // `searchRank` = position in the hybrid search ranking (0 = best).
      return hasSearch ? { searchRank: 1 } : { createdAt: -1 };
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
  const baseMatch = buildMatch(query, canSeeInactive);

  type FacetResult = {
    data: Array<Record<string, unknown> & { variants: LeanVariant[] }>;
    totalCount: Array<{ count: number }>;
  };
  const runListing = async (match: Record<string, unknown>, rankedIds: mongoose.Types.ObjectId[] | null) => {
    const pipeline: mongoose.PipelineStage[] = [
      { $match: rankedIds ? { ...match, _id: { $in: rankedIds } } : match },
      // Aggregations ignore the schema's `select: false`, so drop the search
      // vector explicitly (early, so it isn't carried through the sort either).
      { $project: { embedding: 0, embeddingHash: 0 } },
    ];
    if (rankedIds) {
      pipeline.push({ $addFields: { searchRank: { $indexOfArray: [rankedIds, "$_id"] } } });
    }
    pipeline.push({ $addFields: { minPrice: { $min: "$variants.basePrice" } } });
    pipeline.push({ $sort: buildSort(query.sort, Boolean(rankedIds)) });
    pipeline.push({
      $facet: {
        data: [{ $skip: (query.page - 1) * query.limit }, { $limit: query.limit }, { $project: { searchRank: 0 } }],
        totalCount: [{ $count: "count" }],
      },
    });
    const [result] = (await Product.aggregate(pipeline)) as FacetResult[];
    return { products: result?.data ?? [], total: result?.totalCount?.[0]?.count ?? 0 };
  };

  let listing: Awaited<ReturnType<typeof runListing>>;
  let searchMeta: Record<string, unknown> | undefined;
  if (query.search) {
    const isActive = typeof baseMatch.isActive === "boolean" ? baseMatch.isActive : undefined;
    const { ids, interpretation } = await searchProductIds(query.search, isActive, {
      interpret: query.interpret ?? true,
    });
    const inferred = inferredFilters(interpretation, query);
    const hasInferred = Object.keys(inferred).length > 0;

    listing = await runListing(hasInferred ? buildMatch({ ...query, ...inferred }, canSeeInactive) : baseMatch, ids);
    // Inferred filters that leave nothing (a size the LLM normalised
    // differently, a colour we don't stock) shouldn't dead-end the shopper —
    // drop them and show the plain relevance results instead.
    let relaxed = false;
    if (hasInferred && listing.total === 0 && ids.length > 0) {
      listing = await runListing(baseMatch, ids);
      relaxed = true;
    }
    searchMeta = { appliedFilters: relaxed ? {} : inferred, interpretedQuery: interpretation?.semanticQuery ?? null, relaxed };
  } else {
    listing = await runListing(baseMatch, null);
  }
  const { products, total } = listing;

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
    ...(searchMeta && { search: searchMeta }),
  });
}

export async function suggestProductsHandler(req: Request, res: Response): Promise<void> {
  const parsed = productSuggestQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.json({ suggestions: [] });
    return;
  }
  const suggestions = await suggestProducts(parsed.data.q);
  // Short browser cache: retyping/backspacing the same prefix shouldn't refetch.
  res.set("Cache-Control", "public, max-age=60");
  res.json({ suggestions });
}

export async function getProductBySlug(req: Request, res: Response): Promise<void> {
  const parsed = productDetailQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query" });
    return;
  }

  const product = (await Product.findOne({ slug: req.params.slug, isActive: true }).lean()) as
    | (Record<string, unknown> & { subcategory?: string; variants: LeanVariant[] })
    | null;
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  // Sizing is configured per-subcategory (see Subcategory.sizeGuide), not per
  // product, so every product under it shares one chart. `subcategory` here
  // is the plain slug string stored on Product, same convention as the
  // subcategory/category list filters above — a subcategory with no guide
  // configured (or a product with no subcategory) resolves to null, and the
  // storefront falls back to its own default guide.
  const subcategoryDoc = product.subcategory
    ? ((await Subcategory.findOne({ slug: product.subcategory, isActive: true })
        .select("sizeGuide")
        .lean()) as { sizeGuide?: ISizeGuide } | null)
    : null;

  res.json({
    product: {
      ...product,
      variants: product.variants.map((v) => withEffectivePrice(v, parsed.data.region)),
      sizeGuide: subcategoryDoc?.sizeGuide ?? null,
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
  // Awaited rather than fire-and-forget: on Vercel the function can be frozen
  // once the response is sent. Never throws — see refreshProductEmbeddings.
  await refreshProductEmbeddings([product._id]);
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

  // No-op (no OpenAI call) unless searchable text actually changed.
  await refreshProductEmbeddings([product._id]);
  // The vector search cache holds each product's isActive flag; refresh it
  // now rather than leaving a (de)activated product wrong for up to 5 min.
  if (parsed.data.isActive !== undefined) invalidateVectorIndex();
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
  invalidateVectorIndex();

  res.json({ product });
}
