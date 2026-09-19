import { mongoose } from "../client.js";

export interface IColor {
  name: string;
  slug: string;
  hex: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const colorSchema = new mongoose.Schema<IColor>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    hex: { type: String, required: true, trim: true, match: /^#[0-9a-fA-F]{6}$/ },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Color = mongoose.models.Color ?? mongoose.model<IColor>("Color", colorSchema);
