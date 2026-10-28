import { mongoose } from "../client.js";

export interface ICategory {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  // Display position, 1-based ascending (ties fall back to name).
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new mongoose.Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, trim: true },
    image: String,
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Category =
  mongoose.models.Category ?? mongoose.model<ICategory>("Category", categorySchema);
