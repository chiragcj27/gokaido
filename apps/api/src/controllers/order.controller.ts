import type { Request, Response } from "express";
import {
  Order,
  Cart,
  Product,
  Address,
  Coupon,
  User,
  RewardTransaction,
  mongoose,
  type ICartItem,
  type IOrder,
  type OrderStatus,
} from "@gokaido/database";
import {
  createOrderSchema,
  cancelOrderSchema,
  adminOrderListQuerySchema,
  adminUpdateOrderSchema,
} from "../schemas/order.schema.js";
import { escapeRegex } from "../utils/regex.js";
import { generateOrderNumber } from "../utils/orderNumber.js";
import { calculatePointsEarned, calculateMaxRedeemableValue } from "../utils/rewardPoints.js";
import {
  initiateSale,
  checkTransactionStatus,
  refundOrVoid,
  verifyInboundHash,
  getSecretKey,
} from "../services/iciciPg.js";

const SITE_URL = (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const API_PUBLIC_URL = (process.env.API_PUBLIC_URL ?? "http://localhost:3001").replace(/\/$/, "");
const GUEST_FALLBACK_EMAIL = "guest@icicibank.com";

type OwnerFilter = { user: string } | { guestId: string };

function resolveOwnerFilter(req: Request): OwnerFilter | null {
  if (req.user) return { user: req.user.id };
  const guestId = req.header("x-guest-id")?.trim();
  if (guestId) return { guestId };
  return null;
}

class InsufficientStockError extends Error {
  constructor(public productName: string, public available: number) {
    super(`Only ${available} of ${productName} in stock`);
  }
}

class InsufficientPointsError extends Error {
  constructor() {
    super("Not enough reward points available");
  }
}

async function restoreStock(order: { items: IOrder["items"] }): Promise<void> {
  await Promise.all(
    order.items.map((item) =>
      Product.updateOne(
        { _id: item.product, "variants.sku": item.variantSku },
        { $inc: { "variants.$.stock": item.quantity } }
      )
    )
  );
}

// Returns points spent at checkout back to the customer's balance — mirrors
// restoreStock and is called alongside it: a failed payment or a cancelled/
// refunded order means the customer never actually "spent" those points.
async function restoreRewardPoints(order: {
  user?: mongoose.Types.ObjectId;
  orderNumber: string;
  rewardPointsUsed: number;
  _id: mongoose.Types.ObjectId;
}): Promise<void> {
  if (!order.user || order.rewardPointsUsed <= 0) return;

  const user = await User.findByIdAndUpdate(
    order.user,
    { $inc: { rewardPoints: order.rewardPointsUsed } },
    { new: true }
  ).select("rewardPoints");
  if (!user) return;

  await RewardTransaction.create({
    user: order.user,
    points: order.rewardPointsUsed,
    type: "redemption_reversed",
    description: `Points returned — order ${order.orderNumber} did not complete`,
    order: order._id,
    balance: user.rewardPoints,
  });
}

// Awards points on a successfully paid order. Guest orders have no account to
// credit. See apps/api/src/utils/rewardPoints.ts for the (placeholder) rate.
async function earnRewardPoints(order: {
  user?: mongoose.Types.ObjectId;
  orderNumber: string;
  total: number;
  _id: mongoose.Types.ObjectId;
}): Promise<void> {
  if (!order.user) return;
  const earned = calculatePointsEarned(order.total);
  if (earned <= 0) return;

  const user = await User.findByIdAndUpdate(
    order.user,
    { $inc: { rewardPoints: earned } },
    { new: true }
  ).select("rewardPoints");
  if (!user) return;

  await RewardTransaction.create({
    user: order.user,
    points: earned,
    type: "earned_order",
    description: `Earned on order ${order.orderNumber}`,
    order: order._id,
    balance: user.rewardPoints,
  });
}

// Reserves stock and, if applicable, deducts reward points for an order —
// shared by createOrder and retryPayment so both attempts get the identical
// atomicity guarantee: the $gte guard in the stock/points update filters
// means a concurrent request racing the same inventory or balance can't
// double-spend it, and either both succeed together in the transaction or
// neither is left half-applied.
async function reserveStockAndPoints(
  order: mongoose.HydratedDocument<IOrder>,
  userId: string | undefined,
  session: mongoose.ClientSession
): Promise<void> {
  for (const item of order.items) {
    const result = await Product.updateOne(
      {
        _id: item.product,
        variants: { $elemMatch: { sku: item.variantSku, stock: { $gte: item.quantity } } },
      },
      { $inc: { "variants.$.stock": -item.quantity } },
      { session }
    );
    if (result.modifiedCount === 0) {
      throw new InsufficientStockError(item.productName, 0);
    }
  }

  if (order.rewardPointsUsed > 0 && userId) {
    const deduction = await User.updateOne(
      { _id: userId, rewardPoints: { $gte: order.rewardPointsUsed } },
      { $inc: { rewardPoints: -order.rewardPointsUsed } },
      { session }
    );
    if (deduction.modifiedCount === 0) {
      throw new InsufficientPointsError();
    }
    const updatedUser = await User.findById(userId).select("rewardPoints").session(session);
    await RewardTransaction.create(
      [
        {
          user: userId,
          points: -order.rewardPointsUsed,
          type: "redeemed",
          description: `Redeemed on order ${order.orderNumber}`,
          order: order._id,
          balance: updatedUser?.rewardPoints ?? 0,
        },
      ],
      { session }
    );
  }
}

// Applies a gateway result (from the browser return, the server-to-server
// advice, or a manual status check) to an order. Idempotent — a second call
// after the order is already "paid" is a no-op, since the return and advice
// channels can both fire for the same attempt.
async function applyGatewayResult(
  order: mongoose.HydratedDocument<IOrder>,
  result: {
    responseCode?: unknown;
    txnID?: unknown;
    paymentID?: unknown;
    paymentMode?: unknown;
  }
): Promise<void> {
  if (order.payment.status === "paid") return;

  const responseCode = typeof result.responseCode === "string" ? result.responseCode : "";
  const isSuccess = responseCode === "000" || responseCode === "0000";
  const isPending = responseCode === "R1000";

  if (isSuccess) {
    order.payment.status = "paid";
    if (typeof result.txnID === "string") order.payment.txnID = result.txnID;
    if (typeof result.paymentID === "string") order.payment.paymentID = result.paymentID;
    if (typeof result.paymentMode === "string") order.payment.paymentMode = result.paymentMode;
    order.payment.responseCode = responseCode;
    order.payment.paidAt = new Date();
    order.status = "confirmed";
    order.statusHistory.push({
      status: "confirmed",
      timestamp: new Date(),
      note: "Payment confirmed by ICICI PG",
    });
    if (order.couponCode) {
      await Coupon.updateOne({ code: order.couponCode }, { $inc: { usedCount: 1 } });
    }
    await earnRewardPoints(order);
  } else if (isPending) {
    order.payment.responseCode = responseCode;
  } else if (order.payment.status !== "failed") {
    order.payment.status = "failed";
    order.payment.responseCode = responseCode || undefined;
    await restoreStock(order);
    await restoreRewardPoints(order);
  }

  await order.save();
}

const ALLOWED_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  placed: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled", "refund_initiated"],
  shipped: ["delivered", "refund_initiated"],
  delivered: ["refund_initiated"],
  cancelled: [],
  refund_initiated: ["refunded"],
  refunded: [],
};

// Refunds (if paid) or releases (if not) an order being cancelled — shared by
// the customer-facing cancel and the admin status-update-to-cancelled path so
// the two can't drift on what "cancel" actually does to stock/payment.
async function refundAndCancel(
  order: mongoose.HydratedDocument<IOrder>
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (order.payment.status === "paid") {
    if (!order.payment.txnID) {
      return { ok: false, error: "Order is paid but has no gateway reference — contact support" };
    }
    const refundResult = await refundOrVoid({
      merchantTxnNo: generateOrderNumber(),
      originalTxnNo: order.payment.txnID,
      amount: order.total,
    });
    if (refundResult.responseCode !== "000" && refundResult.responseCode !== "0000") {
      return {
        ok: false,
        error: refundResult.respDescription ?? "Refund could not be initiated. Please try again shortly.",
      };
    }
    order.payment.status = "refunded";
    order.status = "refunded";
    await restoreStock(order);
    await restoreRewardPoints(order);
  } else {
    if (order.payment.status === "pending") {
      await restoreStock(order);
      await restoreRewardPoints(order);
    }
    order.payment.status = "cancelled";
    order.status = "cancelled";
  }
  return { ok: true };
}

export async function createOrder(req: Request, res: Response): Promise<void> {
  const filter = resolveOwnerFilter(req);
  if (!filter) {
    res.status(400).json({ error: "Authentication or X-Guest-Id header required" });
    return;
  }

  const parsed = createOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid request" });
    return;
  }

  const cart = await Cart.findOne(filter);
  if (!cart || cart.items.length === 0) {
    res.status(400).json({ error: "Your cart is empty" });
    return;
  }

  // Resolve shipping address: saved address (auth only) or inline (guest, or
  // an authenticated customer shipping to a one-off address).
  let shippingAddress: {
    name: string;
    mobile: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  if (parsed.data.addressId) {
    if (!req.user) {
      res.status(400).json({ error: "addressId requires authentication" });
      return;
    }
    const address = (await Address.findOne({
      _id: parsed.data.addressId,
      user: req.user.id,
    }).lean()) as
      | {
          name: string;
          mobile: string;
          line1: string;
          line2?: string;
          city: string;
          state: string;
          pincode: string;
        }
      | null;
    if (!address) {
      res.status(404).json({ error: "Address not found" });
      return;
    }
    shippingAddress = {
      name: address.name,
      mobile: address.mobile,
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
    };
  } else if (parsed.data.shippingAddress) {
    shippingAddress = parsed.data.shippingAddress;
  } else {
    res.status(400).json({ error: "Either addressId or shippingAddress is required" });
    return;
  }

  if (!req.user && !parsed.data.guestName) {
    res.status(400).json({ error: "guestName is required for guest checkout" });
    return;
  }

  const subtotal = (cart.items as ICartItem[]).reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const couponDiscount = cart.couponDiscount ?? 0;
  const deliveryCharge = 0; // TODO: real shipping-cost policy, not yet specified by client

  // Points redemption is auth-only (guests have no balance) and capped —
  // see apps/api/src/utils/rewardPoints.ts for the rate/cap and why.
  let rewardPointsUsed = 0;
  let rewardPointsValue = 0;
  if (req.user && parsed.data.rewardPointsToRedeem) {
    const requestingUser = (await User.findById(req.user.id).select("rewardPoints").lean()) as
      | { rewardPoints: number }
      | null;
    const available = requestingUser?.rewardPoints ?? 0;
    const maxRedeemableValue = calculateMaxRedeemableValue(subtotal - couponDiscount);
    rewardPointsValue = Math.max(
      0,
      Math.min(parsed.data.rewardPointsToRedeem, available, maxRedeemableValue)
    );
    rewardPointsUsed = rewardPointsValue; // 1 point = ₹1
  }

  const total = Math.max(subtotal - couponDiscount + deliveryCharge - rewardPointsValue, 0);

  const orderNumber = generateOrderNumber();
  const cartItems = cart.items as ICartItem[];

  const order = new Order({
    orderNumber,
    user: req.user?.id,
    guestName: !req.user ? parsed.data.guestName : undefined,
    guestMobile: !req.user ? shippingAddress.mobile : undefined,
    guestEmail: !req.user ? parsed.data.guestEmail : undefined,
    items: cartItems.map((item) => ({
      product: item.product,
      productName: item.productName,
      variantSku: item.variantSku,
      variantColor: item.variantColor,
      variantSize: item.variantSize,
      variantImage: item.variantImage,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.quantity * item.unitPrice,
    })),
    shippingAddress,
    deliveryInstructions: parsed.data.deliveryInstructions,
    subtotal,
    deliveryCharge,
    couponCode: cart.appliedCoupon,
    couponDiscount,
    rewardPointsUsed,
    rewardPointsValue,
    total,
    payment: { gateway: "icici", merchantTxnNo: orderNumber, status: "pending" },
    status: "placed",
    statusHistory: [{ status: "placed", timestamp: new Date() }],
  });

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await reserveStockAndPoints(order, req.user?.id, session);
      await order.save({ session });
    });
  } catch (err) {
    if (err instanceof InsufficientStockError) {
      res.status(400).json({ error: `${err.productName} no longer has enough stock` });
      return;
    }
    if (err instanceof InsufficientPointsError) {
      res.status(400).json({ error: err.message });
      return;
    }
    throw err;
  } finally {
    await session.endSession();
  }

  let customerEmailID = parsed.data.guestEmail ?? GUEST_FALLBACK_EMAIL;
  if (req.user) {
    const authUser = (await User.findById(req.user.id).select("email").lean()) as
      | { email?: string }
      | null;
    customerEmailID = authUser?.email ?? GUEST_FALLBACK_EMAIL;
  }

  const saleResult = await initiateSale({
    merchantTxnNo: orderNumber,
    amount: total,
    customerEmailID,
    customerMobileNo: shippingAddress.mobile,
    customerName: shippingAddress.name,
    returnURL: `${API_PUBLIC_URL}/api/orders/payment-return`,
  });

  if (saleResult.responseCode !== "R1000" || !saleResult.redirectURI || !saleResult.tranCtx) {
    order.payment.status = "failed";
    await restoreStock(order);
    await restoreRewardPoints(order);
    await order.save();
    res.status(502).json({
      error: saleResult.responseDescription ?? "Could not initiate payment. Please try again.",
    });
    return;
  }

  order.payment.tranCtx = saleResult.tranCtx;
  await order.save();

  cart.items = [];
  cart.appliedCoupon = undefined;
  cart.couponDiscount = 0;
  await cart.save();

  res.status(201).json({
    order,
    redirectURI: saleResult.redirectURI,
    tranCtx: saleResult.tranCtx,
  });
}

export async function paymentReturn(req: Request, res: Response): Promise<void> {
  const body = req.body as Record<string, unknown>;
  const merchantTxnNo = typeof body.merchantTxnNo === "string" ? body.merchantTxnNo : undefined;

  if (!verifyInboundHash(body, getSecretKey()) || !merchantTxnNo) {
    res.redirect(303, `${SITE_URL}/checkout/failed?reason=invalid_response`);
    return;
  }

  const order = await Order.findOne({ "payment.merchantTxnNo": merchantTxnNo });
  if (!order) {
    res.redirect(303, `${SITE_URL}/checkout/failed?reason=order_not_found`);
    return;
  }

  await applyGatewayResult(order, body);

  const outcome =
    order.payment.status === "paid" ? "success" : order.payment.status === "failed" ? "failed" : "pending";
  res.redirect(303, `${SITE_URL}/orders/${order.orderNumber}?status=${outcome}`);
}

export async function paymentAdvice(req: Request, res: Response): Promise<void> {
  const body = req.body as Record<string, unknown>;
  const merchantTxnNo = typeof body.merchantTxnNo === "string" ? body.merchantTxnNo : undefined;

  if (!verifyInboundHash(body, getSecretKey()) || !merchantTxnNo) {
    res.sendStatus(400);
    return;
  }

  const order = await Order.findOne({ "payment.merchantTxnNo": merchantTxnNo });
  if (!order) {
    res.sendStatus(200); // acknowledge delivery even if we can't match it, per spec guidance
    return;
  }

  await applyGatewayResult(order, body);
  res.sendStatus(200);
}

export async function listMyOrders(req: Request, res: Response): Promise<void> {
  const orders = await Order.find({ user: req.user!.id }).sort({ createdAt: -1 });
  res.json({ orders });
}

export async function getOrder(req: Request, res: Response): Promise<void> {
  const order = await Order.findOne({ _id: req.params.id, user: req.user!.id });
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json({ order });
}

export async function checkPaymentStatus(req: Request, res: Response): Promise<void> {
  const order = await Order.findOne({ _id: req.params.id, user: req.user!.id });
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  if (order.payment.status !== "pending" || !order.payment.txnID) {
    res.json({ order });
    return;
  }

  const statusResult = await checkTransactionStatus(generateOrderNumber(), order.payment.txnID);
  if (statusResult.txnStatus === "SUC") {
    await applyGatewayResult(order, {
      responseCode: "000",
      txnID: order.payment.txnID,
      paymentID: statusResult.txnAuthID,
    });
  } else if (statusResult.txnStatus === "REJ" || statusResult.txnStatus === "ERR") {
    await applyGatewayResult(order, { responseCode: statusResult.txnResponseCode ?? "999" });
  }

  res.json({ order });
}

// Re-initiates payment for an order whose previous attempt failed, without
// making the customer re-shop. Stock and any redeemed points were released
// back when that attempt failed, so this re-reserves both under the same
// atomicity guarantee as the original checkout before calling ICICI again
// with a fresh merchantTxnNo (required — ICICI rejects a reused one).
export async function retryPayment(req: Request, res: Response): Promise<void> {
  const order = await Order.findOne({ _id: req.params.id, user: req.user!.id });
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  if (order.payment.status !== "failed") {
    res.status(400).json({ error: "This order is not in a state that can be retried" });
    return;
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await reserveStockAndPoints(order, req.user!.id, session);
    });
  } catch (err) {
    if (err instanceof InsufficientStockError) {
      res.status(400).json({ error: `${err.productName} no longer has enough stock` });
      return;
    }
    if (err instanceof InsufficientPointsError) {
      res.status(400).json({ error: err.message });
      return;
    }
    throw err;
  } finally {
    await session.endSession();
  }

  const authUser = (await User.findById(req.user!.id).select("email").lean()) as
    | { email?: string }
    | null;

  const newMerchantTxnNo = generateOrderNumber();
  const saleResult = await initiateSale({
    merchantTxnNo: newMerchantTxnNo,
    amount: order.total,
    customerEmailID: authUser?.email ?? GUEST_FALLBACK_EMAIL,
    customerMobileNo: order.shippingAddress.mobile,
    customerName: order.shippingAddress.name,
    returnURL: `${API_PUBLIC_URL}/api/orders/payment-return`,
  });

  if (saleResult.responseCode !== "R1000" || !saleResult.redirectURI || !saleResult.tranCtx) {
    await restoreStock(order);
    await restoreRewardPoints(order);
    res.status(502).json({
      error: saleResult.responseDescription ?? "Could not initiate payment. Please try again.",
    });
    return;
  }

  order.payment.merchantTxnNo = newMerchantTxnNo;
  order.payment.tranCtx = saleResult.tranCtx;
  order.payment.status = "pending";
  order.payment.responseCode = undefined;
  await order.save();

  res.json({ order, redirectURI: saleResult.redirectURI, tranCtx: saleResult.tranCtx });
}

export async function cancelOrder(req: Request, res: Response): Promise<void> {
  const order = await Order.findOne({ _id: req.params.id, user: req.user!.id });
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const parsed = cancelOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  if (order.status !== "placed" && order.status !== "confirmed") {
    res.status(400).json({ error: "This order can no longer be cancelled" });
    return;
  }

  const result = await refundAndCancel(order);
  if (!result.ok) {
    res.status(502).json({ error: result.error });
    return;
  }

  order.statusHistory.push({
    status: order.status,
    timestamp: new Date(),
    note: parsed.data.reason ?? "Cancelled by customer",
  });
  await order.save();

  res.json({ order });
}

export async function adminListOrders(req: Request, res: Response): Promise<void> {
  const parsed = adminOrderListQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query" });
    return;
  }
  const { page, limit, status, paymentStatus, search } = parsed.data;

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (paymentStatus) filter["payment.status"] = paymentStatus;
  if (search) {
    const pattern = new RegExp(escapeRegex(search), "i");
    filter.$or = [
      { orderNumber: pattern },
      { guestName: pattern },
      { guestMobile: pattern },
      { "shippingAddress.name": pattern },
      { "shippingAddress.mobile": pattern },
    ];
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({ path: "user", select: "name mobile" }),
    Order.countDocuments(filter),
  ]);

  res.json({
    orders,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function adminGetOrder(req: Request, res: Response): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400).json({ error: "Invalid order id" });
    return;
  }

  const order = await Order.findById(req.params.id).populate({
    path: "user",
    select: "name mobile email",
  });
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json({ order });
}

export async function adminUpdateOrder(req: Request, res: Response): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400).json({ error: "Invalid order id" });
    return;
  }

  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const parsed = adminUpdateOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid request" });
    return;
  }

  if (parsed.data.trackingNumber !== undefined) order.trackingNumber = parsed.data.trackingNumber;
  if (parsed.data.courierPartner !== undefined) order.courierPartner = parsed.data.courierPartner;

  if (parsed.data.status && parsed.data.status !== order.status) {
    const allowed = ALLOWED_STATUS_TRANSITIONS[order.status as OrderStatus];
    if (!allowed.includes(parsed.data.status)) {
      res.status(400).json({
        error: `Cannot move an order from "${order.status}" to "${parsed.data.status}"`,
      });
      return;
    }

    if (parsed.data.status === "cancelled" || parsed.data.status === "refund_initiated") {
      const result = await refundAndCancel(order);
      if (!result.ok) {
        res.status(502).json({ error: result.error });
        return;
      }
    } else {
      order.status = parsed.data.status;
    }

    order.statusHistory.push({
      status: order.status,
      timestamp: new Date(),
      note: parsed.data.note ?? "Updated by admin",
    });
  }

  await order.save();
  await order.populate({ path: "user", select: "name mobile email" });
  res.json({ order });
}
