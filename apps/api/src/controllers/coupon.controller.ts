import type { Request, Response } from "express";
import { Coupon, mongoose } from "@gokaido/database";
import {
  createCouponSchema,
  updateCouponSchema,
  couponListQuerySchema,
} from "../schemas/coupon.schema.js";

export async function listCoupons(req: Request, res: Response): Promise<void> {
  const parsed = couponListQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query" });
    return;
  }
  const { page, limit, active } = parsed.data;

  const filter: Record<string, unknown> = {};
  if (active !== undefined) filter.isActive = active;

  const [coupons, total] = await Promise.all([
    Coupon.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Coupon.countDocuments(filter),
  ]);

  res.json({
    coupons,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function getCoupon(req: Request, res: Response): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400).json({ error: "Invalid coupon id" });
    return;
  }

  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) {
    res.status(404).json({ error: "Coupon not found" });
    return;
  }

  res.json({ coupon });
}

export async function createCoupon(req: Request, res: Response): Promise<void> {
  const parsed = createCouponSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid coupon" });
    return;
  }

  if (await Coupon.exists({ code: parsed.data.code })) {
    res.status(409).json({ error: "A coupon with this code already exists" });
    return;
  }

  const coupon = await Coupon.create({ ...parsed.data, createdBy: req.user!.id });
  res.status(201).json({ coupon });
}

export async function updateCoupon(req: Request, res: Response): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400).json({ error: "Invalid coupon id" });
    return;
  }

  const parsed = updateCouponSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid coupon" });
    return;
  }

  const coupon = await Coupon.findByIdAndUpdate(req.params.id, parsed.data, { new: true });
  if (!coupon) {
    res.status(404).json({ error: "Coupon not found" });
    return;
  }

  res.json({ coupon });
}

export async function deactivateCoupon(req: Request, res: Response): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400).json({ error: "Invalid coupon id" });
    return;
  }

  const coupon = await Coupon.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!coupon) {
    res.status(404).json({ error: "Coupon not found" });
    return;
  }

  res.json({ coupon });
}
