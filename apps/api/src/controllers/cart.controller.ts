import type { Request, Response } from "express";
import { Cart, Product, mongoose, type ICartItem } from "@gokaido/database";
import { addItemSchema, updateItemSchema, mergeCartSchema } from "../schemas/cart.schema.js";
import { applyCouponSchema } from "../schemas/coupon.schema.js";
import { getEffectivePrice } from "../utils/pricing.js";
import { validateCoupon } from "../utils/coupon.js";
import type { LeanVariant } from "./product.controller.js";

const CART_TTL_MS = 30 * 24 * 60 * 60 * 1000;

type LeanProduct = {
  _id: mongoose.Types.ObjectId;
  name: string;
  images: string[];
  variants: LeanVariant[];
};

type LeanCart = {
  items: ICartItem[];
  appliedCoupon?: string;
  couponDiscount: number;
  rewardPointsToRedeem: number;
};

type OwnerFilter = { user: string } | { guestId: string };

function resolveOwnerFilter(req: Request): OwnerFilter | null {
  if (req.user) return { user: req.user.id };
  const guestId = req.header("x-guest-id")?.trim();
  if (guestId) return { guestId };
  return null;
}

function serializeCart(cart: LeanCart | null) {
  const items = cart?.items ?? [];
  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const couponDiscount = cart?.couponDiscount ?? 0;
  return {
    items,
    appliedCoupon: cart?.appliedCoupon,
    couponDiscount,
    rewardPointsToRedeem: cart?.rewardPointsToRedeem ?? 0,
    subtotal,
    total: Math.max(subtotal - couponDiscount, 0),
    itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
  };
}

// Item quantities/prices drive coupon eligibility and discount amount, so any
// change to the cart's contents invalidates a previously applied coupon —
// the customer re-applies it and gets a freshly validated discount.
function invalidateAppliedCoupon(cart: { appliedCoupon?: string; couponDiscount: number }): void {
  if (cart.appliedCoupon) {
    cart.appliedCoupon = undefined;
    cart.couponDiscount = 0;
  }
}

export async function getCart(req: Request, res: Response): Promise<void> {
  const filter = resolveOwnerFilter(req);
  if (!filter) {
    res.status(400).json({ error: "Authentication or X-Guest-Id header required" });
    return;
  }

  const cart = (await Cart.findOne(filter).lean()) as LeanCart | null;
  res.json({ cart: serializeCart(cart) });
}

export async function addItem(req: Request, res: Response): Promise<void> {
  const filter = resolveOwnerFilter(req);
  if (!filter) {
    res.status(400).json({ error: "Authentication or X-Guest-Id header required" });
    return;
  }

  const parsed = addItemSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid request" });
    return;
  }
  const { productId, variantSku, quantity, region } = parsed.data;

  const product = (await Product.findOne({ _id: productId, isActive: true }).lean()) as LeanProduct | null;
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  const variant = product.variants.find((v) => v.sku === variantSku && v.isActive);
  if (!variant) {
    res.status(404).json({ error: "Variant not found" });
    return;
  }

  let cart = await Cart.findOne(filter);
  if (!cart) cart = new Cart({ ...filter, items: [] });

  const existing = cart.items.find(
    (i: ICartItem) => String(i.product) === productId && i.variantSku === variantSku
  );
  const desiredQty = (existing?.quantity ?? 0) + quantity;
  if (desiredQty > variant.stock) {
    res.status(400).json({ error: `Only ${variant.stock} in stock`, available: variant.stock });
    return;
  }

  const unitPrice = getEffectivePrice(variant, region);
  if (existing) {
    existing.quantity = desiredQty;
    existing.unitPrice = unitPrice;
  } else {
    cart.items.push({
      product: product._id,
      productName: product.name,
      variantSku: variant.sku,
      variantColor: variant.color,
      variantSize: variant.size,
      variantImage: variant.images[0] ?? product.images[0] ?? "",
      quantity,
      unitPrice,
    });
  }

  invalidateAppliedCoupon(cart);
  cart.expiresAt = new Date(Date.now() + CART_TTL_MS);
  await cart.save();

  res.json({ cart: serializeCart(cart.toObject()) });
}

export async function updateItemQuantity(req: Request, res: Response): Promise<void> {
  const filter = resolveOwnerFilter(req);
  if (!filter) {
    res.status(400).json({ error: "Authentication or X-Guest-Id header required" });
    return;
  }

  const parsed = updateItemSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Quantity must be between 0 and 20" });
    return;
  }

  const { productId, variantSku } = req.params as { productId: string; variantSku: string };
  const cart = await Cart.findOne(filter);
  if (!cart) {
    res.status(404).json({ error: "Cart not found" });
    return;
  }

  const index = cart.items.findIndex(
    (i: ICartItem) => String(i.product) === productId && i.variantSku === variantSku
  );
  if (index === -1) {
    res.status(404).json({ error: "Item not found in cart" });
    return;
  }

  const { quantity } = parsed.data;
  if (quantity === 0) {
    cart.items.splice(index, 1);
  } else {
    const product = (await Product.findOne({ _id: productId, isActive: true }).lean()) as LeanProduct | null;
    const variant = product?.variants.find((v) => v.sku === variantSku && v.isActive);
    if (!variant) {
      res.status(404).json({ error: "Variant no longer available" });
      return;
    }
    if (quantity > variant.stock) {
      res.status(400).json({ error: `Only ${variant.stock} in stock`, available: variant.stock });
      return;
    }
    cart.items[index]!.quantity = quantity;
  }

  invalidateAppliedCoupon(cart);
  cart.expiresAt = new Date(Date.now() + CART_TTL_MS);
  await cart.save();

  res.json({ cart: serializeCart(cart.toObject()) });
}

export async function removeItem(req: Request, res: Response): Promise<void> {
  const filter = resolveOwnerFilter(req);
  if (!filter) {
    res.status(400).json({ error: "Authentication or X-Guest-Id header required" });
    return;
  }

  const { productId, variantSku } = req.params as { productId: string; variantSku: string };
  const cart = await Cart.findOne(filter);
  if (!cart) {
    res.status(404).json({ error: "Cart not found" });
    return;
  }

  const index = cart.items.findIndex(
    (i: ICartItem) => String(i.product) === productId && i.variantSku === variantSku
  );
  if (index === -1) {
    res.status(404).json({ error: "Item not found in cart" });
    return;
  }

  cart.items.splice(index, 1);
  invalidateAppliedCoupon(cart);
  await cart.save();

  res.json({ cart: serializeCart(cart.toObject()) });
}

export async function clearCart(req: Request, res: Response): Promise<void> {
  const filter = resolveOwnerFilter(req);
  if (!filter) {
    res.status(400).json({ error: "Authentication or X-Guest-Id header required" });
    return;
  }

  const cart = (await Cart.findOneAndUpdate(
    filter,
    { $set: { items: [], rewardPointsToRedeem: 0, couponDiscount: 0 }, $unset: { appliedCoupon: "" } },
    { new: true }
  ).lean()) as LeanCart | null;

  res.json({ cart: serializeCart(cart) });
}

export async function mergeGuestCart(req: Request, res: Response): Promise<void> {
  const parsed = mergeCartSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "guestId is required" });
    return;
  }
  const { guestId } = parsed.data;
  const userId = req.user!.id;

  const guestCart = await Cart.findOne({ guestId });
  if (!guestCart || guestCart.items.length === 0) {
    if (guestCart) await guestCart.deleteOne();
    const userCart = (await Cart.findOne({ user: userId }).lean()) as LeanCart | null;
    res.json({ cart: serializeCart(userCart) });
    return;
  }

  let userCart = await Cart.findOne({ user: userId });
  if (!userCart) userCart = new Cart({ user: userId, items: [] });

  const productIds = [...new Set(guestCart.items.map((i: ICartItem) => String(i.product)))];
  const products = (await Product.find({ _id: { $in: productIds } }).lean()) as unknown as LeanProduct[];
  const productMap = new Map(products.map((p) => [String(p._id), p]));

  for (const guestItem of guestCart.items as ICartItem[]) {
    const product = productMap.get(String(guestItem.product));
    const variant = product?.variants.find((v) => v.sku === guestItem.variantSku && v.isActive);
    if (!variant) continue;

    const existing = userCart.items.find(
      (i: ICartItem) => String(i.product) === String(guestItem.product) && i.variantSku === guestItem.variantSku
    );
    const mergedQty = Math.min((existing?.quantity ?? 0) + guestItem.quantity, variant.stock);

    if (mergedQty <= 0) {
      if (existing) userCart.items.splice(userCart.items.indexOf(existing), 1);
      continue;
    }

    if (existing) {
      existing.quantity = mergedQty;
    } else {
      userCart.items.push({
        product: guestItem.product,
        productName: product!.name,
        variantSku: variant.sku,
        variantColor: variant.color,
        variantSize: variant.size,
        variantImage: guestItem.variantImage,
        quantity: mergedQty,
        unitPrice: variant.basePrice,
      });
    }
  }

  invalidateAppliedCoupon(userCart);
  userCart.expiresAt = new Date(Date.now() + CART_TTL_MS);
  await userCart.save();
  await guestCart.deleteOne();

  res.json({ cart: serializeCart(userCart.toObject()) });
}

export async function applyCoupon(req: Request, res: Response): Promise<void> {
  const filter = resolveOwnerFilter(req);
  if (!filter) {
    res.status(400).json({ error: "Authentication or X-Guest-Id header required" });
    return;
  }

  const parsed = applyCouponSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Coupon code is required" });
    return;
  }

  const cart = await Cart.findOne(filter);
  if (!cart || cart.items.length === 0) {
    res.status(400).json({ error: "Your cart is empty" });
    return;
  }

  const result = await validateCoupon(
    parsed.data.code,
    req.user?.id,
    (cart.items as ICartItem[]).map((i) => ({
      product: String(i.product),
      quantity: i.quantity,
      unitPrice: i.unitPrice,
    }))
  );

  if ("error" in result) {
    res.status(400).json({ error: result.error });
    return;
  }

  cart.appliedCoupon = result.code;
  cart.couponDiscount = result.discount;
  await cart.save();

  res.json({ cart: serializeCart(cart.toObject()) });
}

export async function removeCoupon(req: Request, res: Response): Promise<void> {
  const filter = resolveOwnerFilter(req);
  if (!filter) {
    res.status(400).json({ error: "Authentication or X-Guest-Id header required" });
    return;
  }

  const cart = (await Cart.findOneAndUpdate(
    filter,
    { $set: { couponDiscount: 0 }, $unset: { appliedCoupon: "" } },
    { new: true }
  ).lean()) as LeanCart | null;

  res.json({ cart: serializeCart(cart) });
}
