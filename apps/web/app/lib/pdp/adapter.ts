import { DEFAULT_FAQS } from "./defaults";
import type {
  ApiColor,
  ApiListProduct,
  ApiProduct,
  ApiReviewsResponse,
  ApiSizeGuide,
} from "./apiTypes";
import type {
  KitAddOn,
  PdpProduct,
  ProductAccordionEntry,
  ProductColorOption,
  ProductReview,
  ProductVariant,
  RelatedProduct,
  SizeGuide,
} from "./types";

const PLACEHOLDER_IMAGE = "/dummy/product-placeholder.png";
const FALLBACK_HEX = "#888888";
const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL"];

export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function compareSizes(a: string, b: string): number {
  const ia = SIZE_ORDER.indexOf(a.toUpperCase());
  const ib = SIZE_ORDER.indexOf(b.toUpperCase());
  if (ia !== -1 && ib !== -1) return ia - ib;
  if (ia !== -1) return -1;
  if (ib !== -1) return 1;
  // Numeric sizes (belts 160, gloves 12oz, ...) sort numerically, anything else alphabetically.
  return a.localeCompare(b, undefined, { numeric: true });
}

function colorLookup(colors: ApiColor[]) {
  const byName = new Map(colors.map((c) => [c.name.trim().toLowerCase(), c]));
  return (name: string) => {
    const known = byName.get(name.trim().toLowerCase());
    return { slug: known?.slug ?? slugify(name), hex: known?.hex ?? FALLBACK_HEX };
  };
}

/** Lowest active price across a product's variants — what listing/related cards show. */
function startingPrice(product: ApiListProduct): number {
  const prices = product.variants.filter((v) => v.isActive).map((v) => v.effectivePrice);
  return prices.length ? Math.min(...prices) : 0;
}

function distinctColors(product: ApiListProduct, resolve: ReturnType<typeof colorLookup>) {
  const seen = new Map<string, { name: string; hex: string }>();
  for (const v of product.variants) {
    if (!v.isActive) continue;
    const { slug, hex } = resolve(v.color);
    if (!seen.has(slug)) seen.set(slug, { name: v.color, hex });
  }
  return [...seen.values()];
}

function toCard(product: ApiListProduct, resolve: ReturnType<typeof colorLookup>): RelatedProduct | null {
  // Cards only ever render the finished card visual (see CLAUDE.md "Product Image Fields"),
  // so a product without one is left out rather than falling back to a plain gallery photo.
  if (!product.cardImage) return null;
  const price = startingPrice(product);
  if (!price) return null;
  return {
    key: product.slug,
    slug: product.slug,
    title: product.name,
    subtitle: product.subcategory ?? product.category,
    imageSrc: product.cardImage,
    price,
    mrp: 0,
    colors: distinctColors(product, resolve),
  };
}

export function toKitAddOns(products: ApiListProduct[], colors: ApiColor[]): KitAddOn[] {
  const resolve = colorLookup(colors);
  return products.flatMap((p) => {
    const card = toCard(p, resolve);
    return card ? [{ ...card, key: card.slug }] : [];
  });
}

export function toRelatedProducts(products: ApiListProduct[], colors: ApiColor[]): RelatedProduct[] {
  const resolve = colorLookup(colors);
  return products.flatMap((p) => {
    const card = toCard(p, resolve);
    return card ? [card] : [];
  });
}

function buildAccordion(p: ApiProduct): ProductAccordionEntry[] {
  const rows: [string, string | undefined][] =
    p.productType === "uniform"
      ? [
          ["Fabric", p.fabric],
          ["Fabric Care", p.fabricCare],
          ["Quality Features", p.qualityFeatures],
          ["Benefit", p.benefit],
        ]
      : [
          ["Material & Padding", p.materialAndPadding],
          ["Hygiene & Maintenance", p.hygieneAndMaintenance],
          ["Replacement Interval", p.replacementInterval],
          ["Safety Outcome", p.safetyOutcome],
          ["Age Group", p.ageGroup],
          ["Skill Level", p.skillLevel],
          ["Sold As", p.soldAs],
          ["Legal Disclaimer", p.legalDisclaimer],
        ];
  rows.push(["Certifications", p.certifications.join(", ")]);
  return rows.flatMap(([title, content]) => (content?.trim() ? [{ title, content: content.trim() }] : []));
}

function toSizeGuide(guide: ApiSizeGuide | null, fallback: SizeGuide): SizeGuide | undefined {
  if (!guide || guide.sizeChart.length === 0) return undefined;
  return {
    title: guide.title || fallback.title,
    description: guide.description || fallback.description,
    measurementImageSrc: guide.measurementImage || fallback.measurementImageSrc,
    measurementGuide: guide.measurementGuide.length ? guide.measurementGuide : fallback.measurementGuide,
    sizeChart: guide.sizeChart,
    footerNote: guide.footerNote || fallback.footerNote,
  };
}

function toReviews(data: ApiReviewsResponse): ProductReview[] {
  return data.reviews.map((r) => ({
    id: r._id,
    author: r.user?.name ?? r.guestName ?? "Gokaido customer",
    rating: r.rating,
    verified: r.isVerifiedPurchase,
    date: r.createdAt,
    title: r.title ?? "",
    text: r.body ?? "",
    thumbsUp: r.helpfulVotes,
    // The backend only tracks helpful votes, not down-votes.
    thumbsDown: 0,
  }));
}

export interface PdpSources {
  product: ApiProduct;
  colors: ApiColor[];
  reviews: ApiReviewsResponse;
  related: ApiListProduct[];
  kit: ApiListProduct[];
  defaultSizeGuide: SizeGuide;
}

/** Maps API documents onto the view-model the product page renders. Returns null if nothing is purchasable. */
export function toPdpProduct(src: PdpSources): PdpProduct | null {
  const { product, colors, reviews, related, kit, defaultSizeGuide } = src;
  const activeVariants = product.variants.filter((v) => v.isActive);
  if (activeVariants.length === 0) return null;

  const resolve = colorLookup(colors);

  const colorOptions = new Map<string, ProductColorOption>();
  for (const v of activeVariants) {
    const { slug, hex } = resolve(v.color);
    const existing = colorOptions.get(slug);
    if (!existing) {
      colorOptions.set(slug, { name: v.color, slug, hex, images: [...v.images] });
    } else if (existing.images.length === 0) {
      existing.images = [...v.images];
    }
  }
  // A color with no photos of its own shows the product-level gallery; with none of those either,
  // the placeholder keeps the gallery (which assumes at least one image) from crashing.
  const galleryFallback = product.images.length ? product.images : [PLACEHOLDER_IMAGE];
  const colorList = [...colorOptions.values()].map((c) => ({
    ...c,
    images: c.images.length ? c.images : galleryFallback,
  }));

  const variants: ProductVariant[] = activeVariants.map((v) => ({
    sku: v.sku,
    colorSlug: resolve(v.color).slug,
    size: v.size,
    price: v.effectivePrice,
    // No MRP in the catalogue model yet, so no strike-through/discount is shown.
    mrp: v.effectivePrice,
    stock: v.stock,
  }));

  const sizes = [...new Set(activeVariants.map((v) => v.size))].sort(compareSizes);

  const isEquipment = product.productType === "equipment";
  const protectionLevel = product.protectionLevel?.trim();
  // The section shows if either half of it has content: the protection stats or the competitor comparison.
  const ourPhoto = product.images[0] ?? colorList[0]?.images[0];
  const comparison =
    isEquipment && product.competitorImage && ourPhoto
      ? { beforeSrc: product.competitorImage, afterSrc: ourPhoto }
      : null;

  const summary = reviews.summary;

  return {
    slug: product.slug,
    name: product.name,
    breadcrumb: [
      { label: "Home", href: "/" },
      { label: "Collections", href: "/collections" },
      { label: product.sport.charAt(0).toUpperCase() + product.sport.slice(1) },
    ],
    description: product.description,
    seo: { title: product.metaTitle, description: product.metaDescription },
    sizes,
    colors: colorList,
    variants,
    accordion: buildAccordion(product),
    subcategorySlug: product.subcategory ?? "",
    sizeGuide: toSizeGuide(product.sizeGuide, defaultSizeGuide),
    protectionStats:
      isEquipment && protectionLevel ? [{ label: "Protection level", value: "", description: protectionLevel }] : [],
    protectionComparison: comparison,
    buildYourKit: toKitAddOns(kit, colors),
    relatedProducts: toRelatedProducts(related, colors),
    reviewSummary: {
      average: summary.average,
      totalCount: summary.totalCount,
      recommendPercent: summary.recommendPercent,
      breakdown: summary.breakdown,
      // Neither is collected by the reviews backend yet.
      talkedAbout: [],
      photoCount: 0,
    },
    reviews: toReviews(reviews),
    faqs: DEFAULT_FAQS,
  };
}
