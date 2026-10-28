import { z } from "zod";

const isoDaySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

// Optional `from`/`to` calendar-day filter shared by admin list + export queries.
export const dateRangeQuerySchema = z.object({
  from: isoDaySchema.optional(),
  to: isoDaySchema.optional(),
});
