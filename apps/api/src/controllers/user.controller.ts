import type { Request, Response } from "express";
import { User, Product, Referral, mongoose } from "@gokaido/database";
import { updateProfileSchema } from "../schemas/user.schema.js";

export async function updateProfile(req: Request, res: Response): Promise<void> {
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid profile data" });
    return;
  }

  const { notifications, ...rest } = parsed.data;

  // Flattened into dot-notation $set so an omitted notification channel keeps
  // its existing value instead of the whole subdocument being replaced.
  const update: Record<string, unknown> = { ...rest };
  if (notifications?.whatsapp !== undefined) update["notifications.whatsapp"] = notifications.whatsapp;
  if (notifications?.sms !== undefined) update["notifications.sms"] = notifications.sms;
  if (notifications?.email !== undefined) update["notifications.email"] = notifications.email;

  if (Object.keys(update).length === 0) {
    res.status(400).json({ error: "No updatable fields provided" });
    return;
  }

  const user = await User.findByIdAndUpdate(
    req.user!.id,
    { $set: update },
    { new: true }
  ).select("-otp -otpExpiresAt");

  res.json({ user });
}

export async function getWishlist(req: Request, res: Response): Promise<void> {
  const user = (await User.findById(req.user!.id)
    .select("wishlist")
    .populate({
      path: "wishlist",
      select: "name slug images variants isActive avgRating reviewCount",
    })
    .lean()) as { wishlist?: unknown[] } | null;

  res.json({ wishlist: user?.wishlist ?? [] });
}

export async function addToWishlist(req: Request, res: Response): Promise<void> {
  const { productId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    res.status(400).json({ error: "Invalid product id" });
    return;
  }

  if (!(await Product.exists({ _id: productId, isActive: true }))) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  await User.findByIdAndUpdate(req.user!.id, { $addToSet: { wishlist: productId } });
  res.status(201).json({ success: true });
}

export async function removeFromWishlist(req: Request, res: Response): Promise<void> {
  const { productId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    res.status(400).json({ error: "Invalid product id" });
    return;
  }

  await User.findByIdAndUpdate(req.user!.id, { $pull: { wishlist: productId } });
  res.json({ success: true });
}

export async function getReferralDashboard(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;

  const [user, referrals] = await Promise.all([
    User.findById(userId).select("referralCode").lean() as Promise<{ referralCode?: string } | null>,
    Referral.find({ referrer: userId })
      .sort({ createdAt: -1 })
      .populate({ path: "referee", select: "name" })
      .lean(),
  ]);

  type PopulatedReferral = (typeof referrals)[number] & { referee?: { name?: string } };

  res.json({
    referralCode: user?.referralCode,
    totalReferrals: referrals.length,
    totalPointsEarned: referrals.reduce((sum, r) => sum + r.referrerPointsAwarded, 0),
    referrals: (referrals as PopulatedReferral[]).map((r) => ({
      refereeName: r.referee?.name,
      status: r.status,
      pointsAwarded: r.referrerPointsAwarded,
      createdAt: r.createdAt,
    })),
  });
}
