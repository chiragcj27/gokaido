import { mongoose } from "../client.js";

export interface ISubcategory {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  category: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const subcategorySchema = new mongoose.Schema<ISubcategory>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true, trim: true },
    description: { type: String, trim: true },
    image: String,
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Slug only needs to be unique within its parent category — the same name
// (e.g. "Gloves") can reasonably exist under both Boxing and MMA.
subcategorySchema.index({ category: 1, slug: 1 }, { unique: true });

export const Subcategory =
  mongoose.models.Subcategory ?? mongoose.model<ISubcategory>("Subcategory", subcategorySchema);
