import { mongoose } from "../client.js";

export type Sport = "karate" | "taekwondo" | "kickboxing" | "boxing" | "mma";
export type ProductType = "uniform" | "equipment";

export interface IProductVariant {
  sku: string;
  color: string;
  size: string;
  stock: number;
  basePrice: number;
  // Indian state name -> price override (e.g. { "Maharashtra": 499 })
  regionPrices: Map<string, number>;
  images: string[];
  isActive: boolean;
}

// One of the (up to 3) stats in the PDP's Protection Level section, e.g.
// "Impact level" / "Light to moderate (training contact)" / 92.
export interface IProtectionStat {
  heading: string;
  subheading: string;
  // Shown as a big "92%" above the heading; omit for stats without a figure.
  percent?: number;
}

export interface IProduct {
  name: string;
  slug: string;
  sport: Sport;
  category: string;
  subcategory?: string;
  productType: ProductType;

  description: string;
  images: string[];
  // The product's single representative photo — a normal full-bleed photo,
  // centre-cropped to fit — used wherever the product shows as a card or
  // thumbnail (listings, related products, kit builder, reels). Separate
  // from `images` (the PDP gallery) so the card shot can be chosen
  // independently.
  cardImage?: string;
  // A competitor's product photo, shown as the "before" side of the
  // before/after comparison slider (see BeforeAfterSlider) — not one of our
  // own product's images.
  competitorImage?: string;
  videos: string[];
  tags: string[];

  variants: IProductVariant[];
  certifications: string[];

  // Uniform-specific
  fabric?: string;
  fabricCare?: string;
  qualityFeatures?: string;
  benefit?: string;

  // Equipment-specific
  ageGroup?: string;
  skillLevel?: string;
  soldAs?: string;
  // PDP Protection Level section: intro paragraph + up to 3 stats.
  protectionDescription?: string;
  protectionStats: IProtectionStat[];
  materialAndPadding?: string;
  hygieneAndMaintenance?: string;
  replacementInterval?: string;
  safetyOutcome?: string;
  legalDisclaimer?: string;

  // SEO
  metaTitle?: string;
  metaDescription?: string;

  isActive: boolean;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestseller: boolean;

  // Denormalized — updated when reviews are approved/rejected
  avgRating: number;
  reviewCount: number;

  createdAt: Date;
  updatedAt: Date;
}

const variantSchema = new mongoose.Schema<IProductVariant>(
  {
    sku: { type: String, required: true },
    color: { type: String, required: true },
    size: { type: String, required: true },
    stock: { type: Number, required: true, min: 0, default: 0 },
    basePrice: { type: Number, required: true },
    regionPrices: { type: Map, of: Number, default: {} },
    images: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { _id: false }
);

const protectionStatSchema = new mongoose.Schema<IProtectionStat>(
  {
    heading: { type: String, required: true },
    subheading: { type: String, default: "" },
    percent: { type: Number, min: 0, max: 100 },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema<IProduct>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    sport: {
      type: String,
      required: true,
      enum: ["karate", "taekwondo", "kickboxing", "boxing", "mma"],
    },
    category: { type: String, required: true },
    subcategory: String,
    productType: {
      type: String,
      required: true,
      enum: ["uniform", "equipment"],
    },

    description: { type: String, default: "" },
    images: [{ type: String }],
    cardImage: String,
    competitorImage: String,
    videos: [{ type: String }],
    tags: [{ type: String }],

    variants: [variantSchema],
    certifications: [{ type: String }],

    // Uniform fields
    fabric: String,
    fabricCare: String,
    qualityFeatures: String,
    benefit: String,

    // Equipment fields
    ageGroup: String,
    skillLevel: String,
    soldAs: String,
    protectionDescription: String,
    protectionStats: {
      type: [protectionStatSchema],
      default: [],
      validate: [(v: IProtectionStat[]) => v.length <= 3, "At most 3 protection stats"],
    },
    materialAndPadding: String,
    hygieneAndMaintenance: String,
    replacementInterval: String,
    safetyOutcome: String,
    legalDisclaimer: String,

    metaTitle: String,
    metaDescription: String,

    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },
    isBestseller: { type: Boolean, default: false },

    avgRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

productSchema.index({ sport: 1, category: 1 });
// Collection pages: active products of a category, grouped by subcategory.
productSchema.index({ category: 1, isActive: 1, subcategory: 1 });
productSchema.index({ isActive: 1, isFeatured: 1 });
productSchema.index({ name: "text", description: "text", tags: "text" });

export const Product =
  mongoose.models.Product ?? mongoose.model<IProduct>("Product", productSchema);
