import { z } from "zod";
import { isOwnPublicUrl } from "../services/s3.js";

const ownUrl = z.string().url().refine(isOwnPublicUrl, "Must be an uploaded asset URL");

// "" means "clear this field" from the admin form (same convention as stores)
// — the controller turns it into a real $unset.
const optionalText = (max: number) => z.string().trim().max(max).optional();

export const createEventSchema = z.object({
  name: z.string().trim().min(1, "Event name is required").max(160),
  year: z.string().trim().min(1, "Year is required").max(20),
  category: optionalText(80),
  about: z.string().trim().min(1, "About is required").max(1200),
  dates: optionalText(80),
  place: z.string().trim().min(1, "Event place is required").max(300),
  sport: z.string().trim().min(1, "Sport is required").max(80),
  recognition: optionalText(200),
  hostedBy: optionalText(200),
  images: z.array(ownUrl).min(1, "Add at least one photo").max(12),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional(),
  isActive: z.boolean().optional(),
});

export const updateEventSchema = createEventSchema.partial();
