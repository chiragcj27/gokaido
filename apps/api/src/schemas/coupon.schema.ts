import { z } from "zod";

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

export const couponTypeSchema = z.enum(["percentage", "fixed"]);

// No `.default()` here: this schema backs both create (Mongoose's own schema
// defaults cover omitted keys) and update (`.partial()` below), where a
// default would otherwise clobber an existing value the request didn't mention.
export const createCouponSchema = z
  .object({
    code: z.string().trim().min(3).max(30).toUpperCase(),
    type: couponTypeSchema,
    value: z.coerce.number().positive(),

    minOrderValue: z.coerce.number().min(0).optional(),
    maxDiscount: z.coerce.number().min(0).optional(),

    usageLimit: z.coerce.number().int().positive().optional(),
    perUserLimit: z.coerce.number().int().positive().optional(),

    applicableProducts: z.array(objectIdSchema).optional(),
    applicableCategories: z.array(z.string().trim()).optional(),

    validFrom: z.coerce.date(),
    validUntil: z.coerce.date(),

    isActive: z.boolean().optional(),
  })
  .refine((data) => data.validUntil > data.validFrom, {
    message: "validUntil must be after validFrom",
    path: ["validUntil"],
  })
  .refine((data) => data.type !== "percentage" || data.value <= 100, {
    message: "Percentage discount cannot exceed 100",
    path: ["value"],
  });

export const updateCouponSchema = z.object({
  type: couponTypeSchema.optional(),
  value: z.coerce.number().positive().optional(),
  minOrderValue: z.coerce.number().min(0).optional(),
  maxDiscount: z.coerce.number().min(0).optional(),
  usageLimit: z.coerce.number().int().positive().optional(),
  perUserLimit: z.coerce.number().int().positive().optional(),
  applicableProducts: z.array(objectIdSchema).optional(),
  applicableCategories: z.array(z.string().trim()).optional(),
  validFrom: z.coerce.date().optional(),
  validUntil: z.coerce.date().optional(),
  isActive: z.boolean().optional(),
});

export const couponListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  active: z.coerce.boolean().optional(),
});

export const applyCouponSchema = z.object({
  code: z.string().trim().min(1),
});
