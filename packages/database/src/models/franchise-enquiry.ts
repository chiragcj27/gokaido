import { mongoose } from "../client.js";

// Where the enquirer heard about Gokaido — the options in the franchise form's dropdown.
export const FRANCHISE_ENQUIRY_SOURCES = [
  "instagram",
  "facebook",
  "youtube",
  "google",
  "store",
  "referral",
  "other",
] as const;
export type FranchiseEnquirySource = (typeof FRANCHISE_ENQUIRY_SOURCES)[number];

export const FRANCHISE_ENQUIRY_STATUSES = ["new", "contacted", "closed"] as const;
export type FranchiseEnquiryStatus = (typeof FRANCHISE_ENQUIRY_STATUSES)[number];

// A "Sign up today" submission from the storefront /our-franchise page.
export interface IFranchiseEnquiry {
  name: string;
  email: string;
  // Free-form, may be international — the form invites partners from any city or country.
  phone: string;
  city: string; // "City / Country" as typed
  businessName: string;
  source?: FranchiseEnquirySource;
  message?: string;
  status: FranchiseEnquiryStatus;
  // Internal follow-up notes from the admin portal — never shown to the enquirer.
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const franchiseEnquirySchema = new mongoose.Schema<IFranchiseEnquiry>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    businessName: { type: String, required: true, trim: true },
    source: { type: String, enum: FRANCHISE_ENQUIRY_SOURCES },
    message: { type: String, trim: true },
    status: { type: String, enum: FRANCHISE_ENQUIRY_STATUSES, default: "new" },
    adminNotes: { type: String, trim: true },
  },
  { timestamps: true }
);

franchiseEnquirySchema.index({ status: 1, createdAt: -1 });

export const FranchiseEnquiry =
  mongoose.models.FranchiseEnquiry ??
  mongoose.model<IFranchiseEnquiry>("FranchiseEnquiry", franchiseEnquirySchema);
