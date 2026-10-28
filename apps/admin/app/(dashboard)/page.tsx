"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, ApiError } from "../../lib/api";
import type { AttentionCounts, Order, OrderStatus } from "../../lib/types";

interface RevenueWindow {
  revenue: number;
  orders: number;
}

interface Dashboard {
  attention: AttentionCounts & { stuckPayments: number };
  revenue: { today: RevenueWindow; last7: RevenueWindow; last30: RevenueWindow };
  ordersByStatus: Partial<Record<OrderStatus, number>>;
  lowStock: { productId: string; name: string; slug: string; sku: string; color: string; size: string; stock: number }[];
  lowStockThreshold: number;
  topProducts: { _id: string; name: string; units: number; revenue: number }[];
  recentOrders: Order[];
  customers: { total: number; newLast30: number };
}

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

const STATUS_ORDER: OrderStatus[] = [
  "placed",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
  "refund_initiated",
  "refunded",
];

function statusPillClass(status: OrderStatus): string {
  if (status === "delivered") return "pill-active";
  if (status === "cancelled") return "pill-danger";
  if (status === "refunded") return "pill-inactive";
  return "pill-warning";
}

export default function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Dashboard>("/api/admin/dashboard")
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load dashboard"));
  }, []);

  if (error) {
    return (
      <div>
        <h1>Dashboard</h1>
        <p className="form-error">{error}</p>
      </div>
    );
  }
  if (!data) {
    return (
      <div>
        <h1>Dashboard</h1>
        <p>Loading…</p>
      </div>
    );
  }

  const { attention, revenue } = data;
  const actions = [
    { label: "Orders to ship", count: attention.toShip, href: "/orders?status=confirmed" },
    { label: "Refunds to complete", count: attention.refundsPending, href: "/orders?status=refund_initiated" },
    {
      label: "Payments stuck > 1h",
      count: attention.stuckPayments,
      href: "/orders?status=placed&paymentStatus=pending",
      hint: "Open each and use Check status",
    },
    { label: "Reviews to moderate", count: attention.pendingReviews, href: "/reviews" },
    { label: "New franchise enquiries", count: attention.newEnquiries, href: "/franchise-enquiries" },
  ];

  return (
    <div>
      <h1>Dashboard</h1>

      <h2 className="section-title">Needs attention</h2>
      <div className="stat-grid stat-grid-wide">
        {actions.map((a) => (
          <Link key={a.label} href={a.href} className={`stat-card stat-link ${a.count > 0 ? "stat-alert" : ""}`}>
            <span className="stat-label">{a.label}</span>
            <span className="stat-value">{a.count}</span>
            {a.hint && a.count > 0 && <span className="cell-sub">{a.hint}</span>}
          </Link>
        ))}
      </div>

      <h2 className="section-title">Sales (paid orders)</h2>
      <div className="stat-grid stat-grid-wide">
        {[
          { label: "Today", w: revenue.today },
          { label: "Last 7 days", w: revenue.last7 },
          { label: "Last 30 days", w: revenue.last30 },
        ].map(({ label, w }) => (
          <div key={label} className="stat-card">
            <span className="stat-label">{label}</span>
            <span className="stat-value">{inr(w.revenue)}</span>
            <span className="cell-sub">
              {w.orders} order{w.orders === 1 ? "" : "s"}
              {w.orders > 0 ? ` · avg ${inr(w.revenue / w.orders)}` : ""}
            </span>
          </div>
        ))}
        <Link href="/customers" className="stat-card stat-link">
          <span className="stat-label">Customers</span>
          <span className="stat-value">{data.customers.total}</span>
          <span className="cell-sub">+{data.customers.newLast30} in 30 days</span>
        </Link>
      </div>

      <h2 className="section-title">Orders by status</h2>
      <div className="chip-row">
        {STATUS_ORDER.map((s) => (
          <Link key={s} href={`/orders?status=${s}`} className="chip">
            {s} <strong>{data.ordersByStatus[s] ?? 0}</strong>
          </Link>
        ))}
      </div>

      <div className="dashboard-columns">
        <section>
          <div className="section-header">
            <h2 className="section-title">Recent orders</h2>
            <Link href="/orders">All orders →</Link>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <tbody>
                {data.recentOrders.map((o) => {
                  const customer = typeof o.user === "object" ? o.user : undefined;
                  return (
                    <tr key={o._id}>
                      <td>
                        <Link href={`/orders?search=${o.orderNumber}`} className="mono">
                          {o.orderNumber}
                        </Link>
                        <div className="cell-sub">
                          {o.guestName ?? customer?.name ?? o.shippingAddress?.name ?? "—"}
                        </div>
                      </td>
                      <td className="mono">{inr(o.total)}</td>
                      <td>
                        <span className={`pill ${statusPillClass(o.status)}`}>{o.status}</span>
                      </td>
                    </tr>
                  );
                })}
                {data.recentOrders.length === 0 && (
                  <tr>
                    <td className="empty-row">No orders yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="section-title">Top sellers · 30 days</h2>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Units</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.topProducts.map((p) => (
                  <tr key={p._id}>
                    <td className="cell-wrap">{p.name}</td>
                    <td className="mono">{p.units}</td>
                    <td className="mono">{inr(p.revenue)}</td>
                  </tr>
                ))}
                {data.topProducts.length === 0 && (
                  <tr>
                    <td colSpan={3} className="empty-row">
                      No paid orders in the last 30 days.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div className="section-header">
        <h2 className="section-title">Low stock (≤ {data.lowStockThreshold} units)</h2>
        <Link href="/products">Products →</Link>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Colour / size</th>
              <th>Stock</th>
            </tr>
          </thead>
          <tbody>
            {data.lowStock.map((v) => (
              <tr key={v.sku}>
                <td className="cell-wrap">{v.name}</td>
                <td className="mono">{v.sku}</td>
                <td>
                  {v.color} / {v.size}
                </td>
                <td>
                  <span className={`pill ${v.stock === 0 ? "pill-danger" : "pill-warning"}`}>
                    {v.stock === 0 ? "Out of stock" : v.stock}
                  </span>
                </td>
              </tr>
            ))}
            {data.lowStock.length === 0 && (
              <tr>
                <td colSpan={4} className="empty-row">
                  Every active variant has more than {data.lowStockThreshold} units.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
