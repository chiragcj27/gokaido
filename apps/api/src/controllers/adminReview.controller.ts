import type { Request, Response } from "express";
import { Review, Product, User, mongoose } from "@gokaido/database";
import {
  adminReviewListQuerySchema,
  rejectReviewSchema,
  createAdminReviewSchema,
} from "../schemas/review.schema.js";
import { recalculateProductRating } from "../utils/productRating.js";

export async function listReviews(req: Request, res: Response): Promise<void> {
  const parsed = adminReviewListQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query" });
    return;
  }

  const { product, status, page, limit } = parsed.data;
  const filter: Record<string, unknown> = {};
  if (product) filter.product = product;
  if (status && status !== "all") filter.status = status;

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate("user", "name mobile")
      .populate("product", "name slug")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Review.countDocuments(filter),
  ]);

  res.json({
    reviews,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function createReview(req: Request, res: Response): Promise<void> {
  const parsed = createAdminReviewSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid review data" });
    return;
  }

  const { product, user, status, isVerifiedPurchase, ...rest } = parsed.data;

  if (!(await Product.exists({ _id: product }))) {
    res.status(400).json({ error: "Product not found" });
    return;
  }

  if (user && !(await User.exists({ _id: user }))) {
    res.status(400).json({ error: "User not found" });
    return;
  }

  // Admin-entered reviews are pre-vetted by whoever is typing them in, so
  // default straight to approved rather than sitting in the moderation queue.
  const effectiveStatus = status ?? "approved";

  const review = await Review.create({
    ...rest,
    product,
    user,
    isVerifiedPurchase: isVerifiedPurchase ?? false,
    status: effectiveStatus,
    createdBy: req.user!.id,
    ...(effectiveStatus !== "pending" && { moderatedBy: req.user!.id, moderatedAt: new Date() }),
  });

  if (effectiveStatus === "approved") {
    await recalculateProductRating(review.product);
  }

  res.status(201).json({ review });
}

export async function approveReview(req: Request, res: Response): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400).json({ error: "Invalid review id" });
    return;
  }

  const review = await Review.findByIdAndUpdate(
    req.params.id,
    {
      status: "approved",
      moderatedBy: req.user!.id,
      moderatedAt: new Date(),
      rejectionReason: undefined,
    },
    { new: true }
  );
  if (!review) {
    res.status(404).json({ error: "Review not found" });
    return;
  }

  await recalculateProductRating(review.product);
  res.json({ review });
}

export async function rejectReview(req: Request, res: Response): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400).json({ error: "Invalid review id" });
    return;
  }

  const parsed = rejectReviewSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const review = await Review.findByIdAndUpdate(
    req.params.id,
    {
      status: "rejected",
      moderatedBy: req.user!.id,
      moderatedAt: new Date(),
      rejectionReason: parsed.data.reason,
    },
    { new: true }
  );
  if (!review) {
    res.status(404).json({ error: "Review not found" });
    return;
  }

  // Reject can un-approve a previously-approved review, so recompute either way.
  await recalculateProductRating(review.product);
  res.json({ review });
}
