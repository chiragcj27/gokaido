import { cache } from "react";
import { hasAnyProducts, listProductCards } from "../catalog";
import type { RelatedProduct } from "../pdp/types";
import { dummySearch } from "./dummySearch";

/** Multiple of 4 so every full page fills the grid's four-column rows. */
export const SEARCH_PAGE_SIZE = 24;

export interface SearchResults {
  products: RelatedProduct[];
  total: number;
  page: number;
  totalPages: number;
}

/**
 * Full-text search via the product list endpoint (Mongo $text, sorted by relevance).
 * Falls back to dummy results only while the catalogue is empty or the API is unreachable — a
 * real "no match" against a populated catalogue still returns zero results.
 */
export const searchProducts = cache(async (term: string, page: number): Promise<SearchResults> => {
  try {
    const res = await listProductCards({ search: term, sort: "relevance" }, page, SEARCH_PAGE_SIZE);
    if (res.total > 0 || (await hasAnyProducts())) return { ...res, page };
  } catch {
    // fall through to dummy results
  }
  return dummySearch(page, SEARCH_PAGE_SIZE);
});
