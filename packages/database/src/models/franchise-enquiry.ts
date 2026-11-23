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

// Which storefront form the enquiry came from: /become-a-distributor ("franchise") or
// /contact-us ("contact"). Both use the same fields; admin lists them separately.
// Enquiries saved before this field existed have none and are treated as "franchise".
export const FRANCHISE_ENQUIRY_FORMS = ["franchise", "contact"] as const;
export type FranchiseEnquiryForm = (typeof FRANCHISE_ENQUIRY_FORMS)[number];

export const FRANCHISE_ENQUIRY_STATUSES = ["new", "contacted", "closed"] as const;
export type FranchiseEnquiryStatus = (typeof FRANCHISE_ENQUIRY_STATUSES)[number];

// A submission of the storefront enquiry form (franchise page or contact page — see `form`).
export interface IFranchiseEnquiry {
  form?: FranchiseEnquiryForm;
  name: string;
  email: string;
  // Free-form, may be international — the form invites partners from any city or country.
  phone: string;
  city: string; // Older enquiries hold a free-form "City / Country" here
  country?: string; // Required by the API; absent on older enquiries
  businessName?: string; // Required on the franchise form, optional on the contact form
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
    form: { type: String, enum: FRANCHISE_ENQUIRY_FORMS },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    country: { type: String, trim: true },
    businessName: { type: String, trim: true },
    source: { type: String, enum: FRANCHISE_ENQUIRY_SOURCES },
    message: { type: String, trim: true },
    status: { type: String, enum: FRANCHISE_ENQUIRY_STATUSES, default: "new" },
    adminNotes: { type: String, trim: true },
  },
  { timestamps: true }
);

franchiseEnquirySchema.index({ status: 1, createdAt: -1 });
franchiseEnquirySchema.index({ form: 1, createdAt: -1 });

export const FranchiseEnquiry =
  mongoose.models.FranchiseEnquiry ??
  mongoose.model<IFranchiseEnquiry>("FranchiseEnquiry", franchiseEnquirySchema);
