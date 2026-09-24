import { z } from "zod";
import { isOwnPublicUrl } from "../services/s3.js";

const ownUrl = z.string().url().refine(isOwnPublicUrl, "Must be an uploaded asset URL");

// Instagram permalinks only — this is rendered as an outbound link, so keep it
// from being an arbitrary URL.
const instagramUrl = z
  .string()
  .trim()
  .url()
  .max(500)
  .refine((v) => {
    try {
      const host = new URL(v).hostname.replace(/^www\./, "");
      return host === "instagram.com" || host === "instagr.am";
    } catch {
      return false;
    }
  }, "Must be an instagram.com link")
  // Needs to be a post/reel permalink (the embed is built from its shortcode),
  // not a profile link.
  .refine((v) => /\/(reel|reels|p|tv)\/[\w-]+/.test(new URL(v).pathname), "Must be a link to a specific reel or post");

// "" means "clear this field" from the admin form (same convention as stores).
const reelFields = z.object({
  title: z.string().trim().min(1).max(120),
  videoUrl: z.union([ownUrl, z.literal("")]).optional(),
  posterUrl: z.union([ownUrl, z.literal("")]).optional(),
  instagramUrl: z.union([instagramUrl, z.literal("")]).optional(),
  product: z.union([z.string().regex(/^[a-f\d]{24}$/i, "Invalid product id"), z.literal("")]).optional(),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional(),
  isActive: z.boolean().optional(),
});

export const createReelSchema = reelFields.refine((d) => d.videoUrl || d.instagramUrl, {
  message: "Add a video, an Instagram link, or both",
});

// The "at least one" rule can't be checked on a partial body — the controller
// checks it against the merged document.
export const updateReelSchema = reelFields.partial();
