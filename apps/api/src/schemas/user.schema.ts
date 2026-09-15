import { z } from "zod";
import { mobileSchema } from "./auth.schema.js";

// name and mobile are deliberately absent — both are immutable after
// registration, so any attempt to change them is silently dropped by Zod's
// default unknown-key stripping rather than needing explicit rejection.
export const updateProfileSchema = z.object({
  email: z.string().trim().toLowerCase().email().optional(),
  dob: z.coerce.date().optional(),
  whatsapp: mobileSchema.optional(),
  region: z.string().trim().optional(),
  language: z.enum(["en", "hi", "mr", "ta"]).optional(),
  notifications: z
    .object({
      whatsapp: z.boolean().optional(),
      sms: z.boolean().optional(),
      email: z.boolean().optional(),
    })
    .optional(),
});

export const rewardTransactionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
