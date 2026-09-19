// View-model the product page renders. Both the sample product (dummyProduct.ts)
// and the API-backed product (lib/pdp/adapter.ts) produce this shape, so the
// page components never need to know which source they're fed by.

export interface ProductColorOption {
  name: string;
  /** URL path segment, e.g. /products/karate-guards/red */
  slug: string;
  hex: string;
  /** Gallery images for this color — may have a studio/lifestyle background. */
  images: string[];
}

export interface ProductVariant {
  sku: string;
  colorSlug: string;
  size: string;
  price: number;
  mrp: number;
  stock: number;
}

export interface ProductAccordionEntry {
  title: string;
  content: string;
}

export interface ProtectionStat {
  label: string;
  value: string;
  description: string;
}

export interface SizeChartRow {
  size: string;
  /** Chest circumference range in cm. */
  chestMinCm: number;
  chestMaxCm: number;
  /** Garment length in cm. */
  lengthCm: number;
}

export interface MeasurementGuidePoint {
  /** Badge letter shown on the diagram, e.g. "A". */
  letter: string;
  title: string;
  description: string;
}

// Mirrors ISizeGuide (packages/database/src/models/subcategory.ts) — sizing
// is a subcategory-wide concern (every product under a subcategory shares
// one chart) rather than per-product, and is optional per subcategory, so
// resolving a product's guide always falls back to DEFAULT_SIZE_GUIDE below
// when its subcategory hasn't configured one. Fields here are non-optional
// because this is the *resolved* shape (post-fallback) the UI renders —
// the admin-editable source fields are optional, matching the DB schema.
export interface SizeGuide {
  title: string;
  description: string;
  measurementImageSrc: string;
  measurementGuide: MeasurementGuidePoint[];
  sizeChart: SizeChartRow[];
  footerNote: string;
}

export interface KitAddOn {
  key: string;
  title: string;
  subtitle: string;
  imageSrc: string;
  price: number;
  mrp: number;
  colors: { name: string; hex: string }[];
}

export interface RelatedProduct {
  key: string;
  slug: string;
  title: string;
  subtitle: string;
  imageSrc: string;
  price: number;
  mrp: number;
  colors: { name: string; hex: string }[];
}

export interface ProductReview {
  id: string;
  author: string;
  rating: number;
  verified: boolean;
  /** Not collected by the reviews backend — only present on the sample product. */
  ageRange?: string;
  sport?: string;
  date: string;
  title: string;
  text: string;
  thumbsUp: number;
  thumbsDown: number;
}

export interface ReviewSummary {
  average: number;
  totalCount: number;
  recommendPercent: number;
  breakdown: { stars: 5 | 4 | 3 | 2 | 1; count: number }[];
  talkedAbout: string[];
  photoCount: number;
}

export interface Faq {
  question: string;
  answer: string;
}

export interface PdpProduct {
  slug: string;
  name: string;
  breadcrumb: { label: string; href?: string }[];
  description: string;
  /** Admin-set SEO overrides; the page falls back to name/description when absent. */
  seo?: { title?: string; description?: string };
  sizes: string[];
  colors: ProductColorOption[];
  variants: ProductVariant[];
  accordion: ProductAccordionEntry[];
  /** Slug of the subcategory this product belongs to — drives which size guide it inherits. */
  subcategorySlug: string;
  /** Resolved size guide. Unset means "use DEFAULT_SIZE_GUIDE" (the sample product resolves its own by subcategory). */
  sizeGuide?: SizeGuide;
  /** Empty hides the whole Protection Level section (non-equipment products). */
  protectionStats: ProtectionStat[];
  /**
   * Before/after slider images. `undefined` = the section's dummy placeholders (sample product only);
   * `null` = no comparison photo available, slider is hidden.
   */
  protectionComparison?: { beforeSrc: string; afterSrc: string } | null;
  buildYourKit: KitAddOn[];
  relatedProducts: RelatedProduct[];
  reviewSummary: ReviewSummary;
  reviews: ProductReview[];
  faqs: Faq[];
}
