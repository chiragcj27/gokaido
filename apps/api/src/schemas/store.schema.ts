import { z } from "zod";
import { isOwnPublicUrl } from "../services/s3.js";

const ownUrl = z.string().url().refine(isOwnPublicUrl, "Must be an uploaded asset URL");

// "" means "clear this field" from the admin form (same convention as
// homepage settings) — the controller turns it into a real $unset.
const optionalText = (max: number) => z.string().trim().max(max).optional();

export const createStoreSchema = z.object({
  city: z.string().trim().min(1).max(60),
  name: z.string().trim().min(1).max(120),
  address: z.string().trim().min(1).max(400),
  hours: optionalText(120),
  phone: optionalText(30),
  image: z.union([ownUrl, z.literal("")]).optional(),
  directionsUrl: z.union([z.string().trim().url().max(500), z.literal("")]).optional(),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional(),
  isActive: z.boolean().optional(),
});

export const updateStoreSchema = createStoreSchema.partial();
