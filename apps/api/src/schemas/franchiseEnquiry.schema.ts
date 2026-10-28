import { z } from "zod";
import { FRANCHISE_ENQUIRY_SOURCES, FRANCHISE_ENQUIRY_STATUSES } from "@gokaido/database";
import { dateRangeQuerySchema } from "./dateRange.schema.js";

export const createFranchiseEnquirySchema = z.object({
  name: z.string({ error: "Name is required" }).trim().min(1, "Name is required").max(120),
  email: z.string({ error: "Email is required" }).trim().email("Enter a valid email").max(200),
  // Digits with optional leading + and common separators; 7–15 digits covers Indian and international numbers.
  phone: z
    .string({ error: "Phone is required" })
    .trim()
    .regex(/^\+?[\d\s()-]+$/, "Enter a valid phone number")
    .refine((v) => {
      const digits = v.replace(/\D/g, "").length;
      return digits >= 7 && digits <= 15;
    }, "Enter a valid phone number"),
  city: z.string({ error: "City / country is required" }).trim().min(1, "City / country is required").max(120),
  businessName: z.string({ error: "Business name is required" }).trim().min(1, "Business name is required").max(160),
  // "" = the dropdown was left on its placeholder.
  source: z.union([z.enum(FRANCHISE_ENQUIRY_SOURCES), z.literal("")], { error: "Invalid option" }).optional(),
  message: z.string().trim().max(2000).optional(),
});

// Filters shared by the admin enquiry list and its Excel export.
export const adminFranchiseEnquiryFilterSchema = dateRangeQuerySchema.extend({
  status: z.enum([...FRANCHISE_ENQUIRY_STATUSES, "all"]).optional(),
  search: z.string().trim().max(100).optional(),
});

export const adminFranchiseEnquiryListQuerySchema = adminFranchiseEnquiryFilterSchema.extend({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const updateFranchiseEnquirySchema = z.object({
  status: z.enum(FRANCHISE_ENQUIRY_STATUSES).optional(),
  adminNotes: z.string().trim().max(2000).optional(),
});
