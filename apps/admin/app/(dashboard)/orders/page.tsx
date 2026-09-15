"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError } from "../../../lib/api";
import type { Order, OrderStatus, PaymentStatus } from "../../../lib/types";
import OrderDetail from "../../../components/OrderDetail";

const STATUS_OPTIONS: OrderStatus[] = [
  "placed",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
  "refund_initiated",
  "refunded",
];

const PAYMENT_STATUS_OPTIONS: PaymentStatus[] = ["pending", "paid", "failed", "refunded", "cancelled"];

function statusPillClass(status: OrderStatus): string {
  if (status === "delivered") return "pill-active";
  if (status === "cancelled") return "pill-danger";
  if (status === "refunded") return "pill-inactive";
  return "pill-warning";
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filter/page changes can fire overlapping requests (e.g. resetting one
  // filter right before typing into another); a slower earlier response
  // arriving after a faster later one would otherwise clobber fresher state.
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (status) params.set("status", status);
      if (paymentStatus) params.set("paymentStatus", paymentStatus);
      if (search) params.set("search", search);

      const res = await api.get<{ orders: Order[]; pagination: { totalPages: number } }>(
        `/api/admin/orders?${params.toString()}`
      );
      if (requestId !== requestIdRef.current) return;
      setOrders(res.orders);
      setTotalPages(res.pagination.totalPages || 1);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(err instanceof ApiError ? err.message : "Failed to load orders");
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [page, status, paymentStatus, search]);

  useEffect(() => {
    load();
  }, [load]);

  const selectedOrder = orders.find((o) => o._id === selectedId);

  if (selectedOrder) {
    return (
      <OrderDetail
        order={selectedOrder}
        onBack={() => {
          setSelectedId(null);
          load();
        }}
        onUpdated={(updated) => {
          setOrders((prev) => prev.map((o) => (o._id === updated._id ? updated : o)));
        }}
      />
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Orders</h1>
      </div>

      <div className="form-grid">
        <label>
          Status
          <select
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
          >
            <option value="">All</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label>
          Payment status
          <select
            value={paymentStatus}
            onChange={(e) => {
              setPage(1);
              setPaymentStatus(e.target.value);
            }}
          >
            <option value="">All</option>
            {PAYMENT_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="full-width">
          Search (order number, customer name or mobile)
          <input
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            placeholder="GK... or 98765..."
          />
        </label>
      </div>

      {error && <p className="form-error">{error}</p>}

      {loading ? (
        <p>Loading…</p>
      ) : (
        <>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Placed</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const customer = typeof o.user === "object" ? o.user : undefined;
                  return (
                    <tr key={o._id}>
                      <td className="mono">{o.orderNumber}</td>
                      <td>{o.guestName ?? customer?.name ?? customer?.mobile ?? "—"}</td>
                      <td className="mono">₹{o.total}</td>
                      <td>
                        <span className={`pill ${statusPillClass(o.status)}`}>{o.status}</span>
                      </td>
                      <td className="mono">{o.payment.status}</td>
                      <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                      <td className="row-actions">
                        <button type="button" onClick={() => setSelectedId(o._id)}>
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="empty-row">
                      No orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
