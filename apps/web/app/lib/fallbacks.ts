// Placeholder data shown when the API is down or has nothing to show yet (empty catalogue, no
// bestsellers flagged, nothing saved in admin). Every dynamic section falls back to these instead of
// rendering empty — they go away on their own once real data exists. Tracked in DUMMY_DATA.md.
import type { RelatedProduct } from "./pdp/types";
import type { Store } from "./stores";

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

// /our-franchise store list when the API is down or has no stores yet — the
// list from the design. Every phone number in the design is the same
// placeholder; real numbers come from Admin → Stores.
export const DUMMY_STORES: Store[] = (
  [
    { city: "Mumbai", address: "GROUND FLOOR, SHOP NO 5, 136-B DECCAN CHAMBER BUILDING, J.S.S ROAD, GIRGAUM, MUMBAI, MUMBAI, MAHARASHTRA, 400004", isHeadOffice: true },
    { city: "Panvel", address: "4, Plot 29, Silver Crest - Geomatrix - Sector-25, near Khandeshwar railway station, Navi Mumbai, Kamothe-Panvel 410209 Maharashtra, KAMOTHE (Akshar bldg)" },
    { city: "Kalyan", address: "SHOP NO. 16, D - WING, REGENCY PARK, HAJI MALANG ROAD, CHAKKI NAKA, KALYAN, Maharashtra 421306" },
    { city: "Pune", address: "TARA SHOPPING MALL, OPP RAHEJA HANDLOOMS, NEAR KAST SAREE, RAVIVAR PETH,SHOP NO305-A PUNE. Maharashtra" },
    { city: "Kolhapur", address: "R.S.NO.1037/A, “SOLITAIRE-1”, APARTMENT, SHOP NO.3,GROUND FLOOR, IN-FRONT OF SHRI LAWN, RADHANAGARI ROAD, NAVI VASHI NAKA, KOLHAPUR, Maharashtra - 416012" },
    { city: "Indore", address: "36 SHRI SHRI VINAYAK TOWENSHIP, BICHOLI ROAD,DEVGURADIYA INDORE, Madhya Pradesh, INDORE, 452001" },
    { city: "Surat", address: "PRIME SHOPPERS, 308, 3RD FLOOR, OPP. SAFAL SQUARE, UDHNA MAGDALLA ROAD, VESU , SURAT, Gujarat 395007" },
    { city: "Baroda", address: "PRIME SHOPPERS, 308, 3RD FLOOR, OPP. SAFAL SQUARE, UDHNA MAGDALLA ROAD, VESU , SURAT, Gujarat 395007" },
    { city: "Goa", address: "Araujo Apartment, Nr Dempo Odysse Building, Next to St Andru Church, Vasco - Goa 403802" },
    { city: "West Bengal", address: "597 S. K NAGAR NAYA BASTI RISHRA , POST : PRAVASNAGAR , HOOGHLY - 712249 West Bengal" },
    { city: "Kerala", address: "POST EDAMUTTAM , BOOKING PERIJANAM, KERLA, EDAMUTTAM, 680568" },
    { city: "Tamil Nadu", address: "43 - A THANTHAI PERIYAR NAGAR, KUNDRA THUR ROAD, KUMANCHAVDI, CHENNAI, Tamil Nadu 600056" },
    { city: "Vishakhapatnam", address: "31-26-6/3/1, 1ST FLOOR Sri Krishna nagar road no 6, Duvvada railway station road, VISHAKHAPATTANAM Andhra Pradesh, 530046" },
    { city: "Assam", address: "2ND FLOOR, NESSA COMPLEX,  OPP. PNB BANK, G.S ROAD, ULUBARI CHARAIL ROAD, ULUBARI, GUWAHATI, Assam - 781007" },
    { city: "Raipur", address: "Shop No. - 5 ,Market Complex , Phase 1 , Capital Homes Behind Science Centre , Saddu , Raipur , C.G . - 492014" },
  ] as { city: string; address: string; isHeadOffice?: boolean }[]
).map((s, i) => ({
  id: `dummy-store-${i}`,
  city: s.city,
  name: `Gokaido ${s.city}`,
  address: s.address,
  hours: null,
  phone: "9820222848",
  image: null,
  directionsUrl: null,
  isHeadOffice: s.isHeadOffice ?? false,
}));

/**
 * Placeholder blog posts for `/blogs` while no post is published (or the API is down).
 * Images reuse existing site photography; copy is filler, not client content.
 */
const DUMMY_BLOG_IMAGES = [
  "/hero/hero.png",
  "/our-franchise/store-interior.png",
  "/about/founders.jpg",
  "/about/founder-note-front.jpg",
  "/franchise/boardroom.png",
  "/franchise/storefront.png",
  "/franchise/office.png",
];

const DUMMY_BLOG_TITLES = [
  "Made to Change the Game: Inside Gokaido's New Competition Karate Gi",
  "How to Choose the Right Karate Gi for Training and Tournaments",
  "From Mumbai to Mauritius: Gokaido Opens Its Newest Franchise Store",
  "Five Decades on the Mat: The Story Behind Gokaido Since 1975",
  "Boxing Gloves 101: Picking the Right Weight for Your Training",
  "Taekwondo Protective Gear: What Every Beginner Needs",
  "Caring for Your Gi: Washing, Drying and Storage Tips",
  "Meet the Athletes: Gokaido-Sponsored Champions of 2026",
  "Behind the Stitch: How a Gokaido Belt Is Made",
  "Sizing Guide: Finding the Perfect Fit for Kids' Uniforms",
  "Hand Wraps vs. Inner Gloves: Which Should You Use?",
  "Gokaido at the National Karate Championship 2026",
  "Building Your First Dojo Kit on a Budget",
];

const DUMMY_BLOG_BODY = [
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
  "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
  "Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit, nec luctus magna felis sollicitudin mauris. Integer in mauris eu nibh euismod gravida.",
].join("\n\n");

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const DUMMY_BLOG_POSTS = DUMMY_BLOG_TITLES.map((title, i) => {
  const published = new Date(Date.UTC(2026, 8, 17 - i * 3, 6));
  return {
    slug: slugify(title),
    title,
    excerpt: null,
    image: DUMMY_BLOG_IMAGES[i % DUMMY_BLOG_IMAGES.length],
    author: "Team Gokaido",
    tags: [],
    publishedAt: published.toISOString(),
    content: DUMMY_BLOG_BODY,
    metaTitle: null,
    metaDescription: null,
  };
});
