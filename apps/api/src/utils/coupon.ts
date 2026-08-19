import { Coupon, Order, Product } from "@gokaido/database";

export interface CouponCartItem {
  product: string;
  quantity: number;
  unitPrice: number;
}

export interface CouponValidationResult {
  code: string;
  discount: number;
}

type LeanCoupon = {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  minOrderValue: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  perUserLimit: number;
  applicableProducts: unknown[];
  applicableCategories: string[];
  validFrom: Date;
  validUntil: Date;
};

// Shared by cart-apply and (later) order-placement, so both sides of a coupon's
// lifecycle agree on eligibility and discount math.
export async function validateCoupon(
  code: string,
  userId: string | undefined,
  items: CouponCartItem[]
): Promise<CouponValidationResult | { error: string }> {
  if (items.length === 0) {
    return { error: "Your cart is empty" };
  }

  const coupon = (await Coupon.findOne({
    code: code.trim().toUpperCase(),
    isActive: true,
  }).lean()) as LeanCoupon | null;
  if (!coupon) {
    return { error: "Invalid coupon code" };
  }

  const now = new Date();
  if (now < coupon.validFrom || now > coupon.validUntil) {
    return { error: "This coupon has expired or is not yet active" };
  }

  if (coupon.usageLimit !== undefined && coupon.usedCount >= coupon.usageLimit) {
    return { error: "This coupon has reached its usage limit" };
  }

  // Per-user limit can only be enforced for logged-in users — a guest cart
  // has no reliable identity to count prior redemptions against.
  if (userId) {
    const userUsageCount = await Order.countDocuments({
      user: userId,
      couponCode: coupon.code,
      "payment.status": { $ne: "failed" },
    });
    if (userUsageCount >= coupon.perUserLimit) {
      return { error: "You have already used this coupon the maximum number of times" };
    }
  }

  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  if (subtotal < coupon.minOrderValue) {
    return { error: `Minimum order value for this coupon is ₹${coupon.minOrderValue}` };
  }

  let eligibleSubtotal = subtotal;
  const hasRestrictions = coupon.applicableProducts.length > 0 || coupon.applicableCategories.length > 0;
  if (hasRestrictions) {
    const productIds = [...new Set(items.map((i) => i.product))];
    const products = (await Product.find({ _id: { $in: productIds } })
      .select("category")
      .lean()) as unknown as Array<{ _id: unknown; category: string }>;
    const categoryById = new Map(products.map((p) => [String(p._id), p.category]));
    const applicableProductIds = new Set(coupon.applicableProducts.map((id) => String(id)));
    const applicableCategories = new Set(coupon.applicableCategories);

    eligibleSubtotal = items.reduce((sum, i) => {
      const eligible =
        applicableProductIds.has(i.product) || applicableCategories.has(categoryById.get(i.product) ?? "");
      return eligible ? sum + i.quantity * i.unitPrice : sum;
    }, 0);

    if (eligibleSubtotal === 0) {
      return { error: "This coupon does not apply to any items in your cart" };
    }
  }

  let discount = coupon.type === "percentage" ? (eligibleSubtotal * coupon.value) / 100 : coupon.value;
  if (coupon.maxDiscount !== undefined) discount = Math.min(discount, coupon.maxDiscount);
  discount = Math.min(discount, eligibleSubtotal);
  discount = Math.round(discount * 100) / 100;

  return { code: coupon.code, discount };
}
