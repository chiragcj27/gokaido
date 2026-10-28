import type { Request, Response } from "express";
import ExcelJS from "exceljs";
import { FranchiseEnquiry, mongoose, type IFranchiseEnquiry } from "@gokaido/database";
import type { z } from "zod";
import {
  adminFranchiseEnquiryFilterSchema,
  adminFranchiseEnquiryListQuerySchema,
  updateFranchiseEnquirySchema,
} from "../schemas/franchiseEnquiry.schema.js";
import { escapeRegex } from "../utils/regex.js";
import { addSheet, EXPORT_ROW_LIMIT, istDateRange, sendWorkbook } from "../utils/excel.js";

// Labels for the storefront form's "How did you hear about us?" values.
const SOURCE_LABELS: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  youtube: "YouTube",
  google: "Google search",
  store: "Gokaido store",
  referral: "Friend / referral",
  other: "Other",
};

function buildFilter({
  status,
  search,
  from,
  to,
}: z.infer<typeof adminFranchiseEnquiryFilterSchema>): Record<string, unknown> {
  const filter: Record<string, unknown> = {};
  if (status && status !== "all") filter.status = status;
  if (search) {
    const re = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ name: re }, { email: re }, { phone: re }, { city: re }, { businessName: re }];
  }
  const createdAt = istDateRange(from, to);
  if (createdAt) filter.createdAt = createdAt;
  return filter;
}

export async function listFranchiseEnquiries(req: Request, res: Response): Promise<void> {
  const parsed = adminFranchiseEnquiryListQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query" });
    return;
  }

  const { page, limit } = parsed.data;
  const filter = buildFilter(parsed.data);

  const [enquiries, total, newCount] = await Promise.all([
    FranchiseEnquiry.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    FranchiseEnquiry.countDocuments(filter),
    FranchiseEnquiry.countDocuments({ status: "new" }),
  ]);

  res.json({
    enquiries,
    newCount,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function updateFranchiseEnquiry(req: Request, res: Response): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400).json({ error: "Invalid enquiry id" });
    return;
  }

  const parsed = updateFranchiseEnquirySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid enquiry update" });
    return;
  }

  const { status, adminNotes } = parsed.data;
  const update: Record<string, unknown> = {};
  if (status) update.$set = { status };
  // "" clears the notes rather than storing an empty string.
  if (adminNotes !== undefined) {
    if (adminNotes === "") update.$unset = { adminNotes: "" };
    else update.$set = { ...(update.$set as object), adminNotes };
  }

  const enquiry = await FranchiseEnquiry.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!enquiry) {
    res.status(404).json({ error: "Enquiry not found" });
    return;
  }
  res.json({ enquiry });
}

// Same filters as the list view, every matching row (up to EXPORT_ROW_LIMIT).
export async function exportFranchiseEnquiries(req: Request, res: Response): Promise<void> {
  const parsed = adminFranchiseEnquiryFilterSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query" });
    return;
  }

  const enquiries = await FranchiseEnquiry.find(buildFilter(parsed.data))
    .sort({ createdAt: -1 })
    .limit(EXPORT_ROW_LIMIT)
    .lean<IFranchiseEnquiry[]>();

  const workbook = new ExcelJS.Workbook();
  addSheet(
    workbook,
    "Franchise enquiries",
    [
      { header: "Received", format: "date", width: 18, value: (e) => e.createdAt },
      { header: "Name", width: 22, value: (e) => e.name },
      { header: "Email", width: 28, value: (e) => e.email },
      { header: "Phone", width: 16, value: (e) => e.phone },
      { header: "City / country", width: 20, value: (e) => e.city },
      { header: "Business", width: 24, value: (e) => e.businessName },
      { header: "Heard via", width: 16, value: (e) => (e.source ? (SOURCE_LABELS[e.source] ?? e.source) : "") },
      { header: "Message", width: 50, value: (e) => e.message },
      { header: "Status", value: (e) => e.status },
      { header: "Admin notes", width: 40, value: (e) => e.adminNotes },
    ],
    enquiries
  );
  await sendWorkbook(res, workbook, "franchise-enquiries");
}
