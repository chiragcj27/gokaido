import type { Request, Response } from "express";
import { FranchiseEnquiry, mongoose } from "@gokaido/database";
import {
  adminFranchiseEnquiryListQuerySchema,
  updateFranchiseEnquirySchema,
} from "../schemas/franchiseEnquiry.schema.js";

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function listFranchiseEnquiries(req: Request, res: Response): Promise<void> {
  const parsed = adminFranchiseEnquiryListQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query" });
    return;
  }

  const { status, search, page, limit } = parsed.data;
  const filter: Record<string, unknown> = {};
  if (status && status !== "all") filter.status = status;
  if (search) {
    const re = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ name: re }, { email: re }, { phone: re }, { city: re }, { businessName: re }];
  }

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
