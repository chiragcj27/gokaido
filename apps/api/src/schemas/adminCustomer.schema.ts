import { z } from "zod";
import { dateRangeQuerySchema } from "./dateRange.schema.js";

// Filters shared by the admin customer list and its Excel export. The date
// range filters on signup date.
export const adminCustomerFilterSchema = dateRangeQuerySchema.extend({
  search: z.string().trim().max(100).optional(),
});

export const adminCustomerListQuerySchema = adminCustomerFilterSchema.extend({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
