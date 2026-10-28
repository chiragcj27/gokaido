import type { Request, Response } from "express";
import { FranchiseEnquiry, Order, Product, Review, User } from "@gokaido/database";

// Variants at or below this many units show up on the dashboard's low-stock list.
const LOW_STOCK_THRESHOLD = 5;

const DAY_MS = 24 * 60 * 60 * 1000;
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

// Midnight India time, `daysAgo` days back (0 = start of today).
function istStartOfDay(daysAgo: number): Date {
  const istNow = Date.now() + IST_OFFSET_MS;
  const istMidnight = istNow - (istNow % DAY_MS);
  return new Date(istMidnight - IST_OFFSET_MS - daysAgo * DAY_MS);
}

// Counts behind the sidebar badges — things waiting on an admin.
async function attentionCounts() {
  const [toShip, refundsPending, pendingReviews, newEnquiries] = await Promise.all([
    Order.countDocuments({ status: "confirmed" }),
    Order.countDocuments({ status: "refund_initiated" }),
    Review.countDocuments({ status: "pending" }),
    FranchiseEnquiry.countDocuments({ status: "new" }),
  ]);
  return { toShip, refundsPending, pendingReviews, newEnquiries };
}

async function paidRevenueSince(since: Date): Promise<{ revenue: number; orders: number }> {
  const [row] = await Order.aggregate<{ revenue: number; orders: number }>([
    { $match: { "payment.status": "paid", "payment.paidAt": { $gte: since } } },
    { $group: { _id: null, revenue: { $sum: "$total" }, orders: { $sum: 1 } } },
  ]);
  return { revenue: row?.revenue ?? 0, orders: row?.orders ?? 0 };
}

export async function getAttentionCounts(_req: Request, res: Response): Promise<void> {
  res.json(await attentionCounts());
}

export async function getDashboard(_req: Request, res: Response): Promise<void> {
  const since30 = istStartOfDay(29);

  const [
    attention,
    today,
    last7,
    last30,
    stuckPayments,
    statusCounts,
    lowStock,
    topProducts,
    recentOrders,
    customers,
    newCustomers,
  ] = await Promise.all([
    attentionCounts(),
    paidRevenueSince(istStartOfDay(0)),
    paidRevenueSince(istStartOfDay(6)),
    paidRevenueSince(since30),
    // Placed > 1h ago with no return/advice from ICICI — worth a "Check status".
    Order.countDocuments({
      status: "placed",
      "payment.status": "pending",
      createdAt: { $lt: new Date(Date.now() - 60 * 60 * 1000) },
    }),
    Order.aggregate<{ _id: string; count: number }>([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Product.aggregate([
      { $match: { isActive: true } },
      { $unwind: "$variants" },
      { $match: { "variants.isActive": true, "variants.stock": { $lte: LOW_STOCK_THRESHOLD } } },
      { $sort: { "variants.stock": 1, name: 1 } },
      { $limit: 25 },
      {
        $project: {
          _id: 0,
          productId: "$_id",
          name: 1,
          slug: 1,
          sku: "$variants.sku",
          color: "$variants.color",
          size: "$variants.size",
          stock: "$variants.stock",
        },
      },
    ]),
    Order.aggregate([
      { $match: { "payment.status": "paid", "payment.paidAt": { $gte: since30 } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          name: { $first: "$items.productName" },
          units: { $sum: "$items.quantity" },
          revenue: { $sum: "$items.totalPrice" },
        },
      },
      { $sort: { units: -1 } },
      { $limit: 5 },
    ]),
    Order.find()
      .sort({ createdAt: -1 })
      .limit(8)
      .select("orderNumber guestName shippingAddress.name total status payment.status createdAt user")
      .populate({ path: "user", select: "name mobile" }),
    User.countDocuments({ role: "customer" }),
    User.countDocuments({ role: "customer", createdAt: { $gte: since30 } }),
  ]);

  res.json({
    attention: { ...attention, stuckPayments },
    revenue: { today, last7, last30 },
    ordersByStatus: Object.fromEntries(statusCounts.map((s) => [s._id, s.count])),
    lowStock,
    lowStockThreshold: LOW_STOCK_THRESHOLD,
    topProducts,
    recentOrders,
    customers: { total: customers, newLast30: newCustomers },
  });
}
