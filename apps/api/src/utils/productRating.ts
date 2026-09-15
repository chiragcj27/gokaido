import { Product, Review, mongoose } from "@gokaido/database";

// Recomputed from scratch (not incremented) so a moderation action can never
// drift the denormalized fields out of sync with the actual approved set.
export async function recalculateProductRating(productId: mongoose.Types.ObjectId): Promise<void> {
  const [stats] = await Review.aggregate([
    { $match: { product: productId, status: "approved" } },
    { $group: { _id: null, avgRating: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);

  await Product.findByIdAndUpdate(productId, {
    avgRating: stats?.avgRating ?? 0,
    reviewCount: stats?.count ?? 0,
  });
}
