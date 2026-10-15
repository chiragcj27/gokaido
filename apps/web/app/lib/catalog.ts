import { cache } from "react";
import { apiGet } from "./pdp/api";
import { toRelatedProducts } from "./pdp/adapter";
import type { ApiColor, ApiListProduct } from "./pdp/apiTypes";
import type { RelatedProduct } from "./pdp/types";
import { DUMMY_CATEGORIES, dummyProducts, type StoreCategory } from "./fallbacks";

// Same TTLs/tags as the PDP and collection fetches — purge early with revalidateTag().
const CATEGORIES_TTL = 300;
const LIST_TTL = 600;
const COLORS_TTL = 3600;

export interface ProductPage {
  products: RelatedProduct[];
  total: number;
  page: number;
  totalPages: number;
}

export const getColors = cache(async (): Promise<ApiColor[]> => {
  try {
    const { colors } = await apiGet<{ colors: ApiColor[] }>("/colors", { revalidate: COLORS_TTL, tags: ["colors"] });
    return Array.isArray(colors) ? colors : [];
  } catch {
    return [];
  }
});

/** Active categories for the navbar and homepage ring; dummies when there are none. */
export const getCategories = cache(async (): Promise<StoreCategory[]> => {
  try {
    const { categories } = await apiGet<{ categories: { name: string; slug: string; image?: string }[] }>(
      "/categories",
      { revalidate: CATEGORIES_TTL, tags: ["categories"] },
    );
    if (!Array.isArray(categories) || categories.length === 0) return DUMMY_CATEGORIES;
    return categories.map((c) => ({
      name: c.name,
      slug: c.slug,
      image: c.image ?? null,
      href: `/collections/${c.slug}`,
    }));
  } catch {
    return DUMMY_CATEGORIES;
  }
});

/** Paginated product cards from GET /products; throws on API failure so callers pick the fallback. */
export async function listProductCards(params: Record<string, string>, page: number, limit: number) {
  const query = new URLSearchParams({ ...params, page: String(page), limit: String(limit) });
  const [list, colors] = await Promise.all([
    apiGet<{ products: ApiListProduct[]; pagination: { total: number; totalPages: number } }>(
      `/products?${query}`,
      { revalidate: LIST_TTL, tags: ["products"] },
    ),
    getColors(),
  ]);
  return {
    // The adapter drops products without a card image, so a page can come back short; the
    // totals stay the API's so page numbers line up with the server-side pages.
    products: toRelatedProducts(list.products, colors),
    total: list.pagination.total,
    totalPages: list.pagination.totalPages,
  };
}

/** One page of placeholders — fallback lists never paginate. */
function fallbackPage(limit: number, prefix: string): ProductPage {
  return { products: dummyProducts(limit, prefix), total: limit, page: 1, totalPages: 1 };
}

/**
 * Products flagged as bestsellers in admin. Falls back to placeholders when none are flagged or
 * the API is unreachable, so the homepage row and /best-sellers never render empty.
 */
export const getBestsellers = cache(async (limit: number, page = 1): Promise<ProductPage> => {
  try {
    const res = await listProductCards({ bestseller: "true", sort: "newest" }, page, limit);
    // total (not products.length) so an out-of-range ?page= still reports real totals for the redirect.
    if (res.total > 0) return { ...res, page };
  } catch {
    // fall through to placeholders
  }
  return fallbackPage(limit, "dummy-bestseller");
});

/** Whether the catalogue has any active product at all — distinguishes "no match" from "no data yet". */
export const hasAnyProducts = cache(async (): Promise<boolean> => {
  try {
    const { pagination } = await apiGet<{ pagination: { total: number } }>("/products?limit=1", {
      revalidate: LIST_TTL,
      tags: ["products"],
    });
    return pagination.total > 0;
  } catch {
    return false;
  }
});

