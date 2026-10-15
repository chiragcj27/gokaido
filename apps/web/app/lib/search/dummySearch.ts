// Dummy search results, used only while the catalogue is empty or the API is unreachable (see
// searchProducts.ts) so the results page + pagination still render. Every query returns the same
// fake list, sliced into pages.
import type { SearchResults } from "./searchProducts";
import { dummyProducts } from "../fallbacks";

// 60 items → 3 pages at 24 per page, enough to exercise the Prev / numbers / Next controls.
const DUMMY_TOTAL = 60;

const DUMMY_SEARCH_PRODUCTS = dummyProducts(DUMMY_TOTAL, "dummy-search", true);

export function dummySearch(page: number, pageSize: number): SearchResults {
  const totalPages = Math.ceil(DUMMY_TOTAL / pageSize);
  return {
    products: DUMMY_SEARCH_PRODUCTS.slice((page - 1) * pageSize, page * pageSize),
    total: DUMMY_TOTAL,
    page,
    totalPages,
  };
}
