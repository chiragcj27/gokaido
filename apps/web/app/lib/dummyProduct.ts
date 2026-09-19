// Dummy data standing in for the real Product/Review documents until the
// API + @gokaido/database wiring for the PDP is built. Shape mirrors the
// decided data model (see CLAUDE.md "Product URLs, Variants & Google
// Shopping Feed") so swapping this for a real fetch later is a drop-in.

import { DEFAULT_SIZE_GUIDE } from "./pdp/defaults";
import type {
  Faq,
  KitAddOn,
  PdpProduct,
  ProductAccordionEntry,
  ProductColorOption,
  ProductReview,
  ProductVariant,
  ProtectionStat,
  RelatedProduct,
  ReviewSummary,
  SizeGuide,
} from "./pdp/types";

// Types now live in ./pdp/types; re-exported so existing component imports keep working.
export type * from "./pdp/types";

/** @deprecated Alias of PdpProduct, kept while the sample product exists. */
export type DummyProduct = PdpProduct;

const DUMMY_IMAGE = "/dummy/product-placeholder.png";

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

// This subcategory's admin-configured chart (see Subcategory.sizeGuide) —
// matches the reference design exactly. A different subcategory (e.g.
// "boxing-gloves") would carry its own title/image/rows here instead.
const CHEST_GUARDS_SIZE_GUIDE: SizeGuide = {
  title: "Size Guide",
  description:
    "Find your perfect fit with our detailed size guide. If you're between sizes, we recommend choosing the larger size for a more comfortable fit.",
  measurementImageSrc: "/mini-mannequin-image.png",
  measurementGuide: [
    {
      letter: "A",
      title: "Chest Circumference",
      description: "Measure around the fullest part of your chest, keeping the tape level and snug.",
    },
    {
      letter: "B",
      title: "Length",
      description: "Measure from the top of the shoulder to the bottom of the guard.",
    },
  ],
  sizeChart: [
    { size: "XS", chestMinCm: 70, chestMaxCm: 75, lengthCm: 40 },
    { size: "S", chestMinCm: 75, chestMaxCm: 80, lengthCm: 42 },
    { size: "M", chestMinCm: 80, chestMaxCm: 85, lengthCm: 44 },
    { size: "L", chestMinCm: 85, chestMaxCm: 90, lengthCm: 46 },
    { size: "XL", chestMinCm: 90, chestMaxCm: 95, lengthCm: 48 },
    { size: "XXL", chestMinCm: 95, chestMaxCm: 100, lengthCm: 50 },
  ],
  footerNote: "Sizes are approximate and may vary slightly by product. For any assistance, feel free to contact our support team.",
};


// Stand-in for `GET Subcategory.sizeGuide`, keyed by subcategory slug — a
// subcategory absent from this map (or present with no override) means
// "hasn't configured a custom guide yet", same as a real Subcategory
// document with no `sizeGuide` set.
const SUBCATEGORY_SIZE_GUIDES: Record<string, SizeGuide> = {
  "chest-guards": CHEST_GUARDS_SIZE_GUIDE,
};

export function getSizeGuideForProduct(product: DummyProduct): SizeGuide {
  return SUBCATEGORY_SIZE_GUIDES[product.subcategorySlug] ?? DEFAULT_SIZE_GUIDE;
}

const COLORS: ProductColorOption[] = [
  { name: "Red", slug: "red", hex: "#e2342a", images: [DUMMY_IMAGE, DUMMY_IMAGE, DUMMY_IMAGE, DUMMY_IMAGE] },
  { name: "White", slug: "white", hex: "#f5f5f5", images: [DUMMY_IMAGE, DUMMY_IMAGE, DUMMY_IMAGE, DUMMY_IMAGE] },
  { name: "Blue", slug: "blue", hex: "#1a3f8f", images: [DUMMY_IMAGE, DUMMY_IMAGE, DUMMY_IMAGE, DUMMY_IMAGE] },
];

function buildVariants(colors: ProductColorOption[], sizes: string[]): ProductVariant[] {
  const variants: ProductVariant[] = [];
  colors.forEach((color) => {
    sizes.forEach((size) => {
      variants.push({
        sku: `KG1-${color.slug.toUpperCase()}-${size}`,
        colorSlug: color.slug,
        size,
        price: 250,
        mrp: 500,
        // XXL isn't in production yet — left in stock: 0 so the size guide
        // modal can demonstrate disabling a chart row that isn't purchasable
        // for this product, rather than every row always being available.
        stock: size === "XXL" ? 0 : 12,
      });
    });
  });
  return variants;
}

export const dummyProduct: DummyProduct = {
  slug: "karate-guards",
  name: "Karate Guards (No. 1)",
  breadcrumb: [
    { label: "Home", href: "/" },
    { label: "Collections", href: "/collections" },
    { label: "Karate" },
  ],
  description:
    "Engineered for training and competition, the Gokaido Karate Guards combine protection, comfort and controlled impact absorption. Designed for martial artists who demand reliable performance through every session.",
  sizes: SIZES,
  colors: COLORS,
  variants: buildVariants(COLORS, SIZES),
  accordion: [
    {
      title: "Material & Padding",
      content:
        "Outer shell in high-density closed-cell foam with a wipe-clean synthetic leather finish, engineered for controlled impact absorption.",
    },
    {
      title: "Hygiene & Maintenance",
      content:
        "Wipe down with a damp cloth after each session and air dry away from direct heat. Avoid machine washing.",
    },
  ],
  subcategorySlug: "chest-guards",
  protectionStats: [
    { label: "Coverage", value: "", description: "Chest & ribs" },
    { label: "Impact level", value: "92%", description: "Light to moderate (training contact)" },
    { label: "Grade", value: "89%", description: "Competition / Approved" },
  ],
  buildYourKit: [
    {
      key: "headgear",
      title: "Karate Headgear",
      subtitle: "Matches this kit",
      imageSrc: DUMMY_IMAGE,
      price: 999,
      mrp: 1299,
      colors: [
        { name: "Blue", hex: "#1a3f8f" },
        { name: "Black", hex: "#151515" },
        { name: "Red", hex: "#e2342a" },
      ],
    },
    {
      key: "gi-jacket",
      title: "Training Gi Jacket",
      subtitle: "Lightweight competition cut",
      imageSrc: DUMMY_IMAGE,
      price: 1899,
      mrp: 2499,
      colors: [
        { name: "Blue", hex: "#1a3f8f" },
        { name: "Black", hex: "#151515" },
      ],
    },
    {
      key: "shin-guards",
      title: "Shin Guards Pro",
      subtitle: "Matches this kit",
      imageSrc: DUMMY_IMAGE,
      price: 899,
      mrp: 1199,
      colors: [
        { name: "Blue", hex: "#1a3f8f" },
        { name: "Black", hex: "#151515" },
        { name: "Red", hex: "#e2342a" },
      ],
    },
  ],
  relatedProducts: [
    {
      key: "karate-gi-red",
      slug: "karate-gi",
      title: "Karate Gi",
      subtitle: "Lorem ipsum",
      imageSrc: DUMMY_IMAGE,
      price: 2499,
      mrp: 0,
      colors: [
        { name: "Red", hex: "#e2342a" },
        { name: "White", hex: "#f5f5f5" },
        { name: "Blue", hex: "#1a3f8f" },
      ],
    },
    {
      key: "boxing-gloves-pro",
      slug: "pro-boxing-gloves",
      title: "Pro Boxing Gloves",
      subtitle: "Lorem ipsum",
      imageSrc: DUMMY_IMAGE,
      price: 2299,
      mrp: 2799,
      colors: [
        { name: "Red", hex: "#e2342a" },
        { name: "White", hex: "#f5f5f5" },
        { name: "Blue", hex: "#1a3f8f" },
      ],
    },
    {
      key: "black-belt-cotton",
      slug: "black-belt-cotton",
      title: "Black Belt - Cotton",
      subtitle: "Lorem ipsum",
      imageSrc: DUMMY_IMAGE,
      price: 499,
      mrp: 649,
      colors: [
        { name: "Black", hex: "#151515" },
        { name: "White", hex: "#f5f5f5" },
      ],
    },
  ],
  reviewSummary: {
    average: 4.2,
    totalCount: 459,
    recommendPercent: 78,
    breakdown: [
      { stars: 5, count: 230 },
      { stars: 4, count: 120 },
      { stars: 3, count: 60 },
      { stars: 2, count: 30 },
      { stars: 1, count: 19 },
    ],
    talkedAbout: ["Comfort", "Durability", "Sizing", "Padding", "Value for money"],
    photoCount: 5,
  },
  reviews: [
    {
      id: "r1",
      author: "Arjun M.",
      rating: 5,
      verified: true,
      ageRange: "25-34",
      sport: "Karate",
      date: "2026-08-02",
      title: "Doesn't shift around during drills",
      text: "Solid protection for sparring, doesn't shift around during drills. Sizing runs true.",
      thumbsUp: 14,
      thumbsDown: 1,
    },
    {
      id: "r2",
      author: "Priya S.",
      rating: 4,
      verified: true,
      ageRange: "35-44",
      sport: "Karate",
      date: "2026-07-21",
      title: "Good quality for the price",
      text: "Good quality for the price. Straps could be a touch longer for adjustment.",
      thumbsUp: 6,
      thumbsDown: 0,
    },
    {
      id: "r3",
      author: "Rohan K.",
      rating: 5,
      verified: false,
      ageRange: "45-54",
      sport: "Karate",
      date: "2026-06-30",
      title: "Holding up well after months of use",
      text: "Bought for my son's dojo sessions, holding up well after a couple months of use.",
      thumbsUp: 3,
      thumbsDown: 0,
    },
    {
      id: "r4",
      author: "Meera J.",
      rating: 4,
      verified: true,
      ageRange: "18-24",
      sport: "Karate",
      date: "2026-06-12",
      title: "Comfortable for long sessions",
      text: "Comfortable for long sessions and the padding holds up well against sparring contact.",
      thumbsUp: 5,
      thumbsDown: 1,
    },
    {
      id: "r5",
      author: "Karan V.",
      rating: 5,
      verified: true,
      ageRange: "25-34",
      sport: "Karate",
      date: "2026-05-28",
      title: "Great fit out of the box",
      text: "Great fit out of the box, no break-in period needed. Would recommend sizing up if in-between sizes.",
      thumbsUp: 9,
      thumbsDown: 0,
    },
  ],
  faqs: [
    {
      question: "What size should I order?",
      answer: "Check the size guide above — sizing is based on chest measurement, not age.",
    },
    {
      question: "Are these approved for competition?",
      answer: "Yes, this grade meets standard competition approval requirements.",
    },
    {
      question: "How do I clean the guards?",
      answer: "Wipe down with a damp cloth after each session and air dry fully before storing.",
    },
    {
      question: "What's the delivery time?",
      answer: "Orders typically dispatch within 2 business days and arrive within 3-7 days depending on location.",
    },
    {
      question: "Can I return if the size doesn't fit?",
      answer: "Yes, unused items in original packaging can be returned within 7 days of delivery.",
    },
  ],
};

export function getProductBySlug(slug: string): DummyProduct | null {
  return dummyProduct.slug === slug
    ? { ...dummyProduct, sizeGuide: getSizeGuideForProduct(dummyProduct) }
    : null;
}
