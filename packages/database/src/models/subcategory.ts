import { mongoose } from "../client.js";

// A single labelled callout on the "how to measure" diagram, e.g. the "A"
// badge pointing at chest circumference.
export interface ISizeGuideMeasurementPoint {
  letter: string;
  title: string;
  description: string;
}

// One row of the size chart table. `size` must match the free-text
// `IProductVariant.size` values exactly (same convention as SKU/size entry
// on the product form) so the PDP can look up which sizes are selectable.
export interface ISizeGuideRow {
  size: string;
  chestMinCm: number;
  chestMaxCm: number;
  lengthCm: number;
}

// Sizing is a subcategory-wide concern (every "Chest Guards" product shares
// one chart) rather than per-product, so it lives here and every Product
// under this Subcategory inherits it. Optional — a Subcategory with no
// sizeGuide falls back to the storefront's default guide.
export interface ISizeGuide {
  title?: string;
  description?: string;
  // Uploaded asset URL for the "how to measure" diagram; falls back to the
  // storefront's default mannequin image when unset.
  measurementImage?: string;
  measurementGuide: ISizeGuideMeasurementPoint[];
  sizeChart: ISizeGuideRow[];
  footerNote?: string;
}

export interface ISubcategory {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  // Small icon shown on hover in the collections page subcategory bar.
  icon?: string;
  category: mongoose.Types.ObjectId;
  sizeGuide?: ISizeGuide;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const sizeGuideMeasurementPointSchema = new mongoose.Schema<ISizeGuideMeasurementPoint>(
  {
    letter: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const sizeGuideRowSchema = new mongoose.Schema<ISizeGuideRow>(
  {
    size: { type: String, required: true, trim: true },
    chestMinCm: { type: Number, required: true, min: 0 },
    chestMaxCm: { type: Number, required: true, min: 0 },
    lengthCm: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const sizeGuideSchema = new mongoose.Schema<ISizeGuide>(
  {
    title: { type: String, trim: true },
    description: { type: String, trim: true },
    measurementImage: String,
    measurementGuide: [sizeGuideMeasurementPointSchema],
    sizeChart: [sizeGuideRowSchema],
    footerNote: { type: String, trim: true },
  },
  { _id: false }
);

const subcategorySchema = new mongoose.Schema<ISubcategory>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true, trim: true },
    description: { type: String, trim: true },
    image: String,
    icon: String,
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    sizeGuide: sizeGuideSchema,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Slug only needs to be unique within its parent category — the same name
// (e.g. "Gloves") can reasonably exist under both Boxing and MMA.
subcategorySchema.index({ category: 1, slug: 1 }, { unique: true });

export const Subcategory =
  mongoose.models.Subcategory ?? mongoose.model<ISubcategory>("Subcategory", subcategorySchema);
