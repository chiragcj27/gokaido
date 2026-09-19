import type { Request, Response } from "express";
import { Review, Order, mongoose } from "@gokaido/database";
import {
  createReviewSchema,
  reviewListQuerySchema,
  objectIdSchema,
} from "../schemas/review.schema.js";

function buildSort(sort: string): Record<string, 1 | -1> {
  switch (sort) {
    case "helpful":
      return { helpfulVotes: -1 };
    case "rating_high":
      return { rating: -1 };
    case "rating_low":
      return { rating: 1 };
    case "newest":
    default:
      return { createdAt: -1 };
  }
}

export async function listProductReviews(req: Request, res: Response): Promise<void> {
  const parsed = reviewListQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid query" });
    return;
  }

  const { product, page, limit, sort } = parsed.data;
  const filter = { product, status: "approved" as const };

  // One grouped pass over the product's approved reviews yields the whole rating histogram
  // (served by the { product, status } index); average/total/recommend% are derived from it.
  const [reviews, total, histogram] = await Promise.all([
    Review.find(filter)
      .select("-helpfulVotedBy")
      .populate("user", "name")
      .sort(buildSort(sort))
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Review.countDocuments(filter),
    Review.aggregate<{ _id: number; count: number }>([
      { $match: { product: new mongoose.Types.ObjectId(product), status: "approved" } },
      { $group: { _id: "$rating", count: { $sum: 1 } } },
    ]),
  ]);

  const countByStars = new Map(histogram.map((row) => [row._id, row.count]));
  const breakdown = ([5, 4, 3, 2, 1] as const).map((stars) => ({ stars, count: countByStars.get(stars) ?? 0 }));
  const ratedTotal = breakdown.reduce((sum, row) => sum + row.count, 0);
  const ratingSum = breakdown.reduce((sum, row) => sum + row.stars * row.count, 0);
  const positive = breakdown.filter((row) => row.stars >= 4).reduce((sum, row) => sum + row.count, 0);

  res.json({
    reviews,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    summary: {
      average: ratedTotal ? Math.round((ratingSum / ratedTotal) * 10) / 10 : 0,
      totalCount: ratedTotal,
      // No explicit "would recommend" question is collected, so 4-5★ share stands in for it.
      recommendPercent: ratedTotal ? Math.round((positive / ratedTotal) * 100) : 0,
      breakdown,
    },
  });
}

export async function createReview(req: Request, res: Response): Promise<void> {
  const parsed = createReviewSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid review data" });
    return;
  }

  const { product, order: orderId, rating, title, body, mediaUrls } = parsed.data;

  const order = await Order.findById(orderId);
  if (!order || String(order.user) !== req.user!.id) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  if (order.status !== "delivered") {
    res.status(400).json({ error: "You can only review a product after it has been delivered." });
    return;
  }

  const purchasedThisProduct = order.items.some(
    (item: { product?: unknown }) => String(item.product) === product
  );
  if (!purchasedThisProduct) {
    res.status(400).json({ error: "This product is not part of that order." });
    return;
  }

  if (await Review.exists({ order: orderId, product })) {
    res.status(409).json({ error: "You have already reviewed this product for this order." });
    return;
  }

  const review = await Review.create({
    product,
    user: req.user!.id,
    order: orderId,
    rating,
    title,
    body,
    mediaUrls,
    isVerifiedPurchase: true,
  });
  res.status(201).json({ review });
}

export async function toggleHelpful(req: Request, res: Response): Promise<void> {
  if (!objectIdSchema.safeParse(req.params.id).success) {
    res.status(400).json({ error: "Invalid review id" });
    return;
  }

  const review = await Review.findById(req.params.id);
  if (!review || review.status !== "approved") {
    res.status(404).json({ error: "Review not found" });
    return;
  }

  const userId = req.user!.id;
  const alreadyVoted = review.helpfulVotedBy.some((id: unknown) => String(id) === userId);

  const updated = await Review.findByIdAndUpdate(
    req.params.id,
    alreadyVoted
      ? { $pull: { helpfulVotedBy: userId }, $inc: { helpfulVotes: -1 } }
      : { $addToSet: { helpfulVotedBy: userId }, $inc: { helpfulVotes: 1 } },
    { new: true }
  );

  res.json({ review: updated, voted: !alreadyVoted });
}
