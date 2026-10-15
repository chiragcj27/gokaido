// Placeholder data shown when the API is down or has nothing to show yet (empty catalogue, no
// bestsellers flagged, nothing saved in admin). Every dynamic section falls back to these instead of
// rendering empty — they go away on their own once real data exists. Tracked in DUMMY_DATA.md.
import type { RelatedProduct } from "./pdp/types";

const DUMMY_IMAGE = "/card/card-sample.png";

export const DUMMY_COLORS = [
  { name: "Red", hex: "#c8102e" },
  { name: "White", hex: "#f5f5f5" },
  { name: "Blue", hex: "#1f4fbf" },
];

/** Product card placeholders, numbered so paginated lists visibly change page to page. */
export function dummyProducts(count: number, prefix = "dummy-product", numbered = false): RelatedProduct[] {
  return Array.from({ length: count }, (_, i) => ({
    key: `${prefix}-${i + 1}`,
    slug: `${prefix}-${i + 1}`,
    title: numbered ? `Lorem ipsum ${i + 1}` : "Lorem ipsum",
    subtitle: "Lorem ipsum",
    imageSrc: DUMMY_IMAGE,
    price: 2499,
    mrp: 3499,
    colors: DUMMY_COLORS,
  }));
}

export interface StoreCategory {
  name: string;
  slug: string;
  image: string | null;
  /** Where the category links — the sample collection page for dummies. */
  href: string;
}

// Order matters for the homepage ring: index 0 starts front-and-centre and the ring wraps, so
// the last entries sit to its left.
export const DUMMY_CATEGORIES: StoreCategory[] = ["Karate", "Taekwondo", "Jujutsu", "MMA", "Boxing"].map(
  (name) => ({
    name,
    slug: name.toLowerCase(),
    image: null,
    href: "/collections",
  }),
);

export const DUMMY_TRENDING_SEARCHES = [
  "Karate Gi",
  "Boxing Gloves",
  "Head Guard",
  "Shin Guards",
  "Taekwondo Dobok",
  "Mouth Guard",
  "Belts",
];

/** Category ring / card image when a category has none uploaded. */
export const CATEGORY_PLACEHOLDER_IMAGE = "/dummy/product-placeholder.png";
