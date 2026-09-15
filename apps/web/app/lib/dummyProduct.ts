// Dummy data standing in for the real Product/Review documents until the
// API + @gokaido/database wiring for the PDP is built. Shape mirrors the
// decided data model (see CLAUDE.md "Product URLs, Variants & Google
// Shopping Feed") so swapping this for a real fetch later is a drop-in.

export interface ProductColorOption {
  name: string;
  /** URL path segment, e.g. /products/karate-guards/red */
  slug: string;
  hex: string;
  /** Gallery images (background-less product cutouts) for this color. */
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

export interface KitAddOn {
  key: string;
  title: string;
  subtitle: string;
  imageSrc: string;
  price: number;
  mrp: number;
  tag?: string;
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
  date: string;
  text: string;
  helpfulCount: number;
}

export interface Faq {
  question: string;
  answer: string;
}

export interface DummyProduct {
  slug: string;
  name: string;
  breadcrumb: { label: string; href?: string }[];
  description: string;
  sizes: string[];
  colors: ProductColorOption[];
  variants: ProductVariant[];
  accordion: ProductAccordionEntry[];
  protectionStats: ProtectionStat[];
  buildYourKit: KitAddOn[];
  relatedProducts: RelatedProduct[];
  reviews: ProductReview[];
  faqs: Faq[];
}

const DUMMY_IMAGE = "/dummy/product-placeholder.png";

const SIZES = ["XS", "S", "M", "L", "XL"];

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
        stock: 12,
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
      title: "Materials & Care",
      content:
        "Outer shell in high-density closed-cell foam with a wipe-clean synthetic leather finish. Hand wipe with a damp cloth; air dry away from direct heat.",
    },
    {
      title: "Shipping & Returns",
      content:
        "Dispatched within 2 business days. Free returns within 7 days of delivery for unused items in original packaging.",
    },
  ],
  protectionStats: [
    { label: "Coverage", value: "3-panel", description: "Chest & ribs" },
    { label: "Impact level", value: "92%", description: "Light to moderate (training contact)" },
    { label: "Grade", value: "89%", description: "Competition / Approved" },
  ],
  buildYourKit: [
    {
      key: "gi-jacket",
      title: "Training Gi Jacket",
      subtitle: "Lightweight competition cut",
      imageSrc: DUMMY_IMAGE,
      price: 1899,
      mrp: 2499,
      tag: "Blue",
    },
    {
      key: "shin-guards",
      title: "Shin Guards Pro",
      subtitle: "Matches this kit",
      imageSrc: DUMMY_IMAGE,
      price: 899,
      mrp: 1199,
      tag: "Blue",
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
  reviews: [
    {
      id: "r1",
      author: "Arjun M.",
      rating: 5,
      verified: true,
      date: "2026-08-02",
      text: "Solid protection for sparring, doesn't shift around during drills. Sizing runs true.",
      helpfulCount: 14,
    },
    {
      id: "r2",
      author: "Priya S.",
      rating: 4,
      verified: true,
      date: "2026-07-21",
      text: "Good quality for the price. Straps could be a touch longer for adjustment.",
      helpfulCount: 6,
    },
    {
      id: "r3",
      author: "Rohan K.",
      rating: 5,
      verified: false,
      date: "2026-06-30",
      text: "Bought for my son's dojo sessions, holding up well after a couple months of use.",
      helpfulCount: 3,
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
  return dummyProduct.slug === slug ? dummyProduct : null;
}
