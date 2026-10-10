import type { Request, Response } from "express";
import { FranchiseEnquiry } from "@gokaido/database";
import { createFranchiseEnquirySchema } from "../schemas/franchiseEnquiry.schema.js";

// Public — the storefront franchise page's "Sign up today" form posts here unauthenticated.
export async function createFranchiseEnquiry(req: Request, res: Response): Promise<void> {
  const parsed = createFranchiseEnquirySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid enquiry" });
    return;
  }

  const { source, message, ...rest } = parsed.data;
  await FranchiseEnquiry.create({ ...rest, ...(source && { source }), ...(message && { message }) });
  res.status(201).json({ ok: true });
}
