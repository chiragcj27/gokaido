// Wire shapes of the API responses the product page consumes (see apps/api product/review/color controllers).

export interface ApiVariant {
  sku: string;
  color: string;
  size: string;
  stock: number;
  basePrice: number;
  mrp?: number;
  effectivePrice: number;
  images: string[];
  isActive: boolean;
}

export interface ApiSizeGuide {
  title?: string;
  description?: string;
  measurementImage?: string;
  measurementGuide: { letter: string; title: string; description: string }[];
  sizeChart: { size: string; chestMinCm: number; chestMaxCm: number; lengthCm: number }[];
  footerNote?: string;
}

export interface ApiProduct {
  _id: string;
  name: string;
  slug: string;
  sport: string;
  category: string;
  subcategory?: string;
  productType: "uniform" | "equipment";
  description: string;
  images: string[];
  cardImage?: string;
  competitorImage?: string;
  certifications: string[];
  fabric?: string;
  fabricCare?: string;
  qualityFeatures?: string;
  benefit?: string;
  ageGroup?: string;
  skillLevel?: string;
  soldAs?: string;
  protectionDescription?: string;
  protectionStats?: { heading: string; subheading: string; percent?: number }[];
  materialAndPadding?: string;
  hygieneAndMaintenance?: string;
  replacementInterval?: string;
  safetyOutcome?: string;
  legalDisclaimer?: string;
  metaTitle?: string;
  metaDescription?: string;
  avgRating: number;
  reviewCount: number;
  variants: ApiVariant[];
  sizeGuide: ApiSizeGuide | null;
}

export interface ApiColor {
  name: string;
  slug: string;
  hex: string;
}

export interface ApiReview {
  _id: string;
  rating: number;
  title?: string;
  body?: string;
  guestName?: string;
  user?: { name?: string } | null;
  isVerifiedPurchase: boolean;
  helpfulVotes: number;
  createdAt: string;
}

export interface ApiReviewsResponse {
  reviews: ApiReview[];
  summary: {
    average: number;
    totalCount: number;
    recommendPercent: number;
    breakdown: { stars: 5 | 4 | 3 | 2 | 1; count: number }[];
  };
}

/** Product as returned inside GET /products (list) — same shape, used for cards. */
export type ApiListProduct = Omit<ApiProduct, "sizeGuide">;

/** `search` block on GET /products?search=… — see apps/api/src/services/productSearch.ts. */
export interface ApiSearchMeta {
  /** Filters the API inferred from the query text ("under 1500" → maxPrice: 1500). */
  appliedFilters: Partial<{
    sport: string;
    category: string;
    subcategory: string;
    productType: string;
    color: string;
    size: string;
    minPrice: number;
    maxPrice: number;
  }>;
  interpretedQuery: string | null;
  /** True when the inferred filters matched nothing and were dropped — results are closest matches. */
  relaxed: boolean;
}

/** GET /products/suggest — search-as-you-type. */
export interface ApiProductSuggestion {
  name: string;
  slug: string;
  cardImage?: string;
  minPrice?: number;
}
