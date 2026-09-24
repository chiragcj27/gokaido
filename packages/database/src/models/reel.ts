import { mongoose } from "../client.js";

// A short vertical video shown in the homepage "See it in action" carousel,
// with one product attached as the small card along the bottom.
//
// Two ways to show one, and a reel needs at least one of `videoUrl` /
// `instagramUrl`:
//  - `videoUrl` (uploaded file): clean full-bleed card that autoplays.
//    Instagram doesn't expose a playable file URL, so this is a manual upload.
//  - `instagramUrl` only: the storefront falls back to Instagram's iframe
//    embed, which carries Instagram's own header/chrome and can't autoplay.
// Either way, when `instagramUrl` is set, clicking the card opens the post.
export interface IReel {
  // Admin-facing label only — never rendered on the storefront.
  title: string;
  videoUrl?: string;
  // Still frame shown before the video loads and on cards that aren't playing.
  posterUrl?: string;
  instagramUrl?: string;
  product?: mongoose.Types.ObjectId;
  // Ascending — controls the order in the carousel.
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const reelSchema = new mongoose.Schema<IReel>(
  {
    title: { type: String, required: true, trim: true },
    videoUrl: { type: String, trim: true },
    posterUrl: { type: String, trim: true },
    instagramUrl: { type: String, trim: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

reelSchema.index({ isActive: 1, sortOrder: 1, createdAt: 1 });

export const Reel = mongoose.models.Reel ?? mongoose.model<IReel>("Reel", reelSchema);
