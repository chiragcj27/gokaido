// TEMPORARY — dummy search results so the results page + pagination can be reviewed before the
// catalogue has real products. Every query returns the same fake list, sliced into pages.
// Tracked in DUMMY_DATA.md; to remove: set USE_DUMMY_SEARCH to false (or delete it and its branch
// in searchProducts.ts) and delete this file.
import type { RelatedProduct } from "../pdp/types";
import type { SearchResults } from "./searchProducts";

export const USE_DUMMY_SEARCH = true;

// 60 items → 3 pages at 24 per page, enough to exercise the Prev / numbers / Next controls.
const DUMMY_TOTAL = 60;

const DUMMY_COLORS = [
  { name: "Red", hex: "#c8102e" },
  { name: "White", hex: "#f5f5f5" },
  { name: "Blue", hex: "#1f4fbf" },
];

const DUMMY_SEARCH_PRODUCTS: RelatedProduct[] = Array.from({ length: DUMMY_TOTAL }, (_, i) => ({
  key: `dummy-search-${i + 1}`,
  slug: `dummy-search-${i + 1}`,
  // Numbered so it's visible that each page shows different items.
  title: `Lorem ipsum ${i + 1}`,
  subtitle: "Lorem ipsum",
  imageSrc: "/card/card-sample.png",
  price: 2499,
  mrp: 3499,
  colors: DUMMY_COLORS,
}));

export function dummySearch(page: number, pageSize: number): SearchResults {
  const totalPages = Math.ceil(DUMMY_TOTAL / pageSize);
  return {
    products: DUMMY_SEARCH_PRODUCTS.slice((page - 1) * pageSize, page * pageSize),
    total: DUMMY_TOTAL,
    page,
    totalPages,
  };
}
