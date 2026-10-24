import { cache } from "react";
import { hasAnyProducts, listProductCards } from "../catalog";
import type { ApiSearchMeta } from "../pdp/apiTypes";
import type { RelatedProduct } from "../pdp/types";
import { dummySearch } from "./dummySearch";

/** Multiple of 4 so every full page fills the grid's four-column rows. */
export const SEARCH_PAGE_SIZE = 24;

export interface SearchResults {
  products: RelatedProduct[];
  total: number;
  page: number;
  totalPages: number;
  /** Absent for dummy results. */
  search?: ApiSearchMeta;
}

/**
 * Hybrid keyword + semantic (AI) search via the product list endpoint, sorted by relevance — see
 * apps/api/src/services/productSearch.ts. The response's `search.appliedFilters` lists any filters
 * the API inferred from the query (e.g. "under 1500" → maxPrice), for showing as removable chips.
 * Falls back to dummy results only while the catalogue is empty or the API is unreachable — a
 * real "no match" against a populated catalogue still returns zero results.
 * `interpret: false` takes the term literally (no inferred filters).
 */
export const searchProducts = cache(async (term: string, page: number, interpret = true): Promise<SearchResults> => {
  try {
    const params: Record<string, string> = { search: term, sort: "relevance" };
    if (!interpret) params.interpret = "false";
    const res = await listProductCards(params, page, SEARCH_PAGE_SIZE);
    if (res.total > 0 || (await hasAnyProducts())) return { ...res, page };
  } catch {
    // fall through to dummy results
  }
  return dummySearch(page, SEARCH_PAGE_SIZE);
});
