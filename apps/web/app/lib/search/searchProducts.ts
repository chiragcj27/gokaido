import { cache } from "react";
import { apiGet } from "../pdp/api";
import { toRelatedProducts } from "../pdp/adapter";
import type { ApiColor, ApiListProduct } from "../pdp/apiTypes";
import type { RelatedProduct } from "../pdp/types";
import { dummySearch, USE_DUMMY_SEARCH } from "./dummySearch";

// Search results track the catalogue like listings do; purge early with revalidateTag("products").
const SEARCH_TTL = 60;
const COLORS_TTL = 3600;
/** Multiple of 4 so every full page fills the grid's four-column rows. */
export const SEARCH_PAGE_SIZE = 24;

export interface SearchResults {
  products: RelatedProduct[];
  total: number;
  page: number;
  totalPages: number;
}

/** Full-text search via the product list endpoint (Mongo $text, sorted by relevance). */
export const searchProducts = cache(async (term: string, page: number): Promise<SearchResults> => {
  // TEMPORARY: fake results for every query until real catalogue data exists — see dummySearch.ts.
  if (USE_DUMMY_SEARCH) return dummySearch(page, SEARCH_PAGE_SIZE);

  const params = new URLSearchParams({
    search: term,
    sort: "relevance",
    page: String(page),
    limit: String(SEARCH_PAGE_SIZE),
  });

  const [list, colors] = await Promise.all([
    apiGet<{ products: ApiListProduct[]; pagination: { total: number; totalPages: number } }>(
      `/products?${params}`,
      { revalidate: SEARCH_TTL, tags: ["products"] },
    ),
    apiGet<{ colors: ApiColor[] }>("/colors", { revalidate: COLORS_TTL, tags: ["colors"] })
      .then((r) => r.colors)
      .catch(() => [] as ApiColor[]),
  ]);

  const { total, totalPages } = list.pagination;
  // The adapter drops products without a card image, so a page can come back short; the totals
  // stay the API's so page numbers line up with the server-side pages.
  return { products: toRelatedProducts(list.products, colors), total, page, totalPages };
});
