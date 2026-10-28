import type { Request, Response } from "express";
import ExcelJS from "exceljs";
import type { z } from "zod";
import { Order, User, mongoose } from "@gokaido/database";
import {
  adminCustomerFilterSchema,
  adminCustomerListQuerySchema,
} from "../schemas/adminCustomer.schema.js";
import { escapeRegex } from "../utils/regex.js";
import { addSheet, EXPORT_ROW_LIMIT, istDateRange, sendWorkbook } from "../utils/excel.js";

const CUSTOMER_FIELDS = "name mobile email region language rewardPoints isActive lastLoginAt createdAt";

interface CustomerRow {
  _id: mongoose.Types.ObjectId;
  name?: string;
  mobile?: string;
  email?: string;
  region?: string;
  language: string;
  rewardPoints: number;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
}

interface OrderStats {
  orders: number;
  spent: number;
  lastOrderAt?: Date;
}

function buildFilter({ search, from, to }: z.infer<typeof adminCustomerFilterSchema>): Record<string, unknown> {
  const filter: Record<string, unknown> = { role: "customer" };
  if (search) {
    const re = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ name: re }, { mobile: re }, { email: re }];
  }
  const createdAt = istDateRange(from, to);
  if (createdAt) filter.createdAt = createdAt;
  return filter;
}

// Paid-order count / spend per customer — only for the ids on the current
// page (or export), so it never scans every order.
async function orderStatsFor(ids: mongoose.Types.ObjectId[]): Promise<Map<string, OrderStats>> {
  const rows = await Order.aggregate<OrderStats & { _id: mongoose.Types.ObjectId }>([
    { $match: { user: { $in: ids }, "payment.status": "paid" } },
    {
      $group: {
        _id: "$user",
        orders: { $sum: 1 },
        spent: { $sum: "$total" },
        lastOrderAt: { $max: "$createdAt" },
      },
    },
  ]);
  return new Map(rows.map((r) => [String(r._id), r]));
}

function withStats(customers: CustomerRow[], stats: Map<string, OrderStats>) {
  return customers.map((c) => ({ ...c, ...(stats.get(String(c._id)) ?? { orders: 0, spent: 0 }) }));
}

export async function listCustomers(req: Request, res: Response): Promise<void> {
  const parsed = adminCustomerListQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query" });
    return;
  }

  const { page, limit } = parsed.data;
  const filter = buildFilter(parsed.data);
  const [customers, total] = await Promise.all([
    User.find(filter)
      .select(CUSTOMER_FIELDS)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean<CustomerRow[]>(),
    User.countDocuments(filter),
  ]);
  const stats = await orderStatsFor(customers.map((c) => c._id));

  res.json({
    customers: withStats(customers, stats),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function exportCustomers(req: Request, res: Response): Promise<void> {
  const parsed = adminCustomerFilterSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query" });
    return;
  }

  const customers = await User.find(buildFilter(parsed.data))
    .select(CUSTOMER_FIELDS)
    .sort({ createdAt: -1 })
    .limit(EXPORT_ROW_LIMIT)
    .lean<CustomerRow[]>();
  const rows = withStats(customers, await orderStatsFor(customers.map((c) => c._id)));

  const workbook = new ExcelJS.Workbook();
  addSheet(
    workbook,
    "Customers",
    [
      { header: "Name", width: 22, value: (c) => c.name },
      { header: "Mobile", width: 14, value: (c) => c.mobile },
      { header: "Email", width: 28, value: (c) => c.email },
      { header: "Region", value: (c) => c.region },
      { header: "Language", value: (c) => c.language },
      { header: "Paid orders", value: (c) => c.orders },
      { header: "Total spent", format: "money", value: (c) => c.spent },
      { header: "Last order", format: "date", width: 18, value: (c) => c.lastOrderAt },
      { header: "Reward points", value: (c) => c.rewardPoints },
      { header: "Signed up", format: "date", width: 18, value: (c) => c.createdAt },
      { header: "Last login", format: "date", width: 18, value: (c) => c.lastLoginAt },
      { header: "Active", value: (c) => (c.isActive ? "Yes" : "No") },
    ],
    rows
  );
  await sendWorkbook(res, workbook, "customers");
}
