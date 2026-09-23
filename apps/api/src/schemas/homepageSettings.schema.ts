import { z } from "zod";
import { isOwnPublicUrl } from "../services/s3.js";

// Every field optional — admin can set/clear the video independently of the
// poster/background (e.g. swap the video, keep the same poster).
const ownUrl = z.string().url().refine(isOwnPublicUrl, "Must be an uploaded asset URL");

export const updateHomepageSettingsSchema = z.object({
  heroVideoUrl: z.union([ownUrl, z.literal("")]).optional(),
  heroVideoPosterUrl: z.union([ownUrl, z.literal("")]).optional(),
  heroBackgroundImageUrl: z.union([ownUrl, z.literal("")]).optional(),
  // One image per product tile in the hero's white card. Capped at 3 — the
  // headline only has room for that many before the card crowds the words.
  heroShowcaseImages: z.array(ownUrl).max(3).optional(),
});
