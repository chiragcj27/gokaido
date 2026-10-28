import { z } from "zod";
import { mobileSchema } from "./auth.schema.js";
import { pincodeSchema } from "./address.schema.js";
import { dateRangeQuerySchema } from "./dateRange.schema.js";

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

const inlineAddressSchema = z.object({
  name: z.string().trim().min(1).max(100),
  mobile: mobileSchema,
  line1: z.string().trim().min(1).max(200),
  line2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().min(1).max(100),
  pincode: pincodeSchema,
});

// Logged-in checkout uses a saved addressId; guest checkout has no saved
// addresses so it supplies the shipping address inline along with contact info.
export const createOrderSchema = z
  .object({
    addressId: objectIdSchema.optional(),
    shippingAddress: inlineAddressSchema.optional(),
    guestName: z.string().trim().min(1).max(100).optional(),
    guestEmail: z.string().trim().toLowerCase().email().optional(),
    deliveryInstructions: z.string().trim().max(300).optional(),
    // Ignored for guest checkout — only an authenticated account has a points balance.
    rewardPointsToRedeem: z.coerce.number().int().min(0).optional(),
  })
  .refine((data) => data.addressId ?? data.shippingAddress, {
    message: "Either addressId or shippingAddress is required",
    path: ["addressId"],
  });

export const cancelOrderSchema = z.object({
  reason: z.string().trim().max(300).optional(),
});

export const orderStatusSchema = z.enum([
  "placed",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
  "refund_initiated",
  "refunded",
]);

// Filters shared by the admin order list and its Excel export.
export const adminOrderFilterSchema = dateRangeQuerySchema.extend({
  status: orderStatusSchema.optional(),
  paymentStatus: z.enum(["pending", "paid", "failed", "refunded", "cancelled"]).optional(),
  search: z.string().trim().min(1).optional(),
});

export const adminOrderListQuerySchema = adminOrderFilterSchema.extend({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const adminUpdateOrderSchema = z.object({
  status: orderStatusSchema.optional(),
  trackingNumber: z.string().trim().max(64).optional(),
  courierPartner: z.string().trim().max(64).optional(),
  note: z.string().trim().max(300).optional(),
});
