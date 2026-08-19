import { z } from "zod";
import { mobileSchema } from "./auth.schema.js";

export const pincodeSchema = z.string().regex(/^[1-9][0-9]{5}$/, "Invalid Indian pincode");

// No `.default()` here: this schema backs both create (Mongoose's own schema
// defaults cover omitted keys) and update (`.partial()` below), where a
// default would otherwise clobber an existing value the request didn't mention.
export const createAddressSchema = z.object({
  label: z.string().trim().min(1).max(30).optional(),
  name: z.string().trim().min(1).max(100),
  mobile: mobileSchema,
  line1: z.string().trim().min(1).max(200),
  line2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().min(1).max(100),
  pincode: pincodeSchema,
  isDefault: z.boolean().optional(),
});

export const updateAddressSchema = createAddressSchema.partial();
