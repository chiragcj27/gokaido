import { cache } from "react";
import { apiGet, ApiError } from "./api";
import { toPdpProduct } from "./adapter";
import { DEFAULT_SIZE_GUIDE } from "./defaults";
import type { ApiColor, ApiListProduct, ApiProduct, ApiReviewsResponse } from "./apiTypes";
import type { PdpProduct } from "./types";

// Product data changes rarely relative to how often it's viewed, so pages are served from the
// fetch cache and refreshed in the background. Stock can be up to a minute stale on screen —
// harmless, since checkout re-validates and atomically reserves stock server-side.
const PRODUCT_TTL = 60;
const REVIEWS_TTL = 300;
const COLORS_TTL = 3600;
const RELATED_TTL = 600;

async function optional<T>(request: Promise<T>, fallback: T): Promise<T> {
  // Secondary sections (reviews, related items) shouldn't take the whole page down if they fail.
  try {
    return await request;
  } catch {
    return fallback;
  }
}

/**
 * Loads everything the product page needs. Wrapped in React `cache` so generateMetadata and the
 * page component share one load per request. Returns null for unknown/inactive/unpurchasable products.
 */
export const getPdpProduct = cache(async (slug: string): Promise<PdpProduct | null> => {
  let product: ApiProduct;
  try {
    ({ product } = await apiGet<{ product: ApiProduct }>(`/products/${encodeURIComponent(slug)}`, {
      revalidate: PRODUCT_TTL,
      tags: ["products", `product:${slug}`],
    }));
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }

  // Everything below depends only on the product document, so it all goes out in parallel.
  const emptyReviews: ApiReviewsResponse = {
    reviews: [],
    summary: {
      average: 0,
      totalCount: 0,
      recommendPercent: 0,
      breakdown: [5, 4, 3, 2, 1].map((stars) => ({ stars: stars as 5 | 4 | 3 | 2 | 1, count: 0 })),
    },
  };

  const [colors, reviews, related, kit] = await Promise.all([
    optional(
      apiGet<{ colors: ApiColor[] }>("/colors", { revalidate: COLORS_TTL, tags: ["colors"] }).then((r) => r.colors),
      [],
    ),
    optional(
      apiGet<ApiReviewsResponse>(`/reviews?product=${product._id}&limit=20`, {
        revalidate: REVIEWS_TTL,
        tags: [`reviews:${slug}`],
      }),
      emptyReviews,
    ),
    // Same category, excluding the current product (the list endpoint has no "exclude" filter,
    // so one extra is requested and the product itself dropped).
    optional(
      apiGet<{ products: ApiListProduct[] }>(
        `/products?category=${encodeURIComponent(product.category)}&limit=9`,
        { revalidate: RELATED_TTL, tags: ["products"] },
      ).then((r) => r.products.filter((p) => p.slug !== slug).slice(0, 8)),
      [],
    ),
    // "Build your kit": same sport, complementary product type.
    optional(
      apiGet<{ products: ApiListProduct[] }>(
        `/products?sport=${product.sport}&productType=${product.productType === "uniform" ? "equipment" : "uniform"}&limit=6`,
        { revalidate: RELATED_TTL, tags: ["products"] },
      ).then((r) => r.products.slice(0, 3)),
      [],
    ),
  ]);

  return toPdpProduct({ product, colors, reviews, related, kit, defaultSizeGuide: DEFAULT_SIZE_GUIDE });
});
