"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api, ApiError } from "../../../lib/api";
import type { Order, OrderStatus, PaymentStatus } from "../../../lib/types";
import { useDebounced } from "../../../lib/useDebounced";
import OrderDetail from "../../../components/OrderDetail";
import ItemThumbs from "../../../components/ItemThumbs";
import ExportButton from "../../../components/ExportButton";
import DateRangeFilter, { type DateRange } from "../../../components/DateRangeFilter";

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

// One-click views for the day-to-day queues; the dropdowns below still allow
// any combination.
const QUICK_VIEWS: { label: string; status: OrderStatus | ""; paymentStatus: PaymentStatus | "" }[] = [
  { label: "All", status: "", paymentStatus: "" },
  { label: "To ship", status: "confirmed", paymentStatus: "" },
  { label: "In transit", status: "shipped", paymentStatus: "" },
  { label: "Awaiting payment", status: "placed", paymentStatus: "pending" },
  { label: "Refunds to complete", status: "refund_initiated", paymentStatus: "" },
  { label: "Failed payments", status: "", paymentStatus: "failed" },
];

function statusPillClass(status: OrderStatus): string {
  if (status === "delivered") return "pill-active";
  if (status === "cancelled") return "pill-danger";
  if (status === "refunded") return "pill-inactive";
  return "pill-warning";
}

function paymentPillClass(status: PaymentStatus): string {
  if (status === "paid") return "pill-active";
  if (status === "failed" || status === "cancelled") return "pill-danger";
  if (status === "refunded") return "pill-inactive";
  return "pill-warning";
}

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

function OrdersPageInner() {
  const searchParams = useSearchParams();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [status, setStatus] = useState(searchParams.get("status") ?? "");
  const [paymentStatus, setPaymentStatus] = useState(searchParams.get("paymentStatus") ?? "");
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [dates, setDates] = useState<DateRange>({ from: "", to: "" });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const debouncedSearch = useDebounced(search.trim());

  // Shared by the list request and the Excel export so the download always
  // matches what's on screen (minus pagination).
  const filterParams = useMemo(() => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (paymentStatus) params.set("paymentStatus", paymentStatus);
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (dates.from) params.set("from", dates.from);
    if (dates.to) params.set("to", dates.to);
    return params.toString();
  }, [status, paymentStatus, debouncedSearch, dates]);

  // Filter/page changes can fire overlapping requests (e.g. resetting one
  // filter right before typing into another); a slower earlier response
  // arriving after a faster later one would otherwise clobber fresher state.
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const res = await api.get<{ orders: Order[]; pagination: { total: number; totalPages: number } }>(
        `/api/admin/orders?page=${page}&limit=20${filterParams ? `&${filterParams}` : ""}`
      );
      if (requestId !== requestIdRef.current) return;
      setOrders(res.orders);
      setTotal(res.pagination.total);
      setTotalPages(res.pagination.totalPages || 1);
      setError(null);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(err instanceof ApiError ? err.message : "Failed to load orders");
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [page, filterParams]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [filterParams]);

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
        <ExportButton path={`/api/admin/orders/export?${filterParams}`} fileName="orders.xlsx" />
      </div>

      <div className="chip-row">
        {QUICK_VIEWS.map((v) => (
          <button
            key={v.label}
            type="button"
            className={`chip ${status === v.status && paymentStatus === v.paymentStatus ? "chip-active" : ""}`}
            onClick={() => {
              setStatus(v.status);
              setPaymentStatus(v.paymentStatus);
            }}
          >
            {v.label}
          </button>
        ))}
      </div>

      <div className="filter-bar">
        <label>
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
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
          <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
            <option value="">All</option>
            {PAYMENT_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="filter-grow">
          Search (order number, customer, mobile or tracking number)
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="GK... or 98765..." />
        </label>
      </div>
      <DateRangeFilter value={dates} onChange={setDates} />

      {error && <p className="form-error">{error}</p>}

      <p className="result-count">{loading ? "Loading…" : `${total} order${total === 1 ? "" : "s"}`}</p>

      <div className={`table-wrap ${loading ? "is-loading" : ""}`}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Products</th>
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
              const units = o.items.reduce((n, i) => n + i.quantity, 0);
              return (
                <tr key={o._id} className="clickable-row" onClick={() => setSelectedId(o._id)}>
                  <td className="mono">{o.orderNumber}</td>
                  <td>
                    {o.guestName ?? customer?.name ?? o.shippingAddress?.name ?? "—"}
                    <div className="cell-sub">
                      {o.guestMobile ?? customer?.mobile ?? o.shippingAddress?.mobile}
                      {o.shippingAddress?.city ? ` · ${o.shippingAddress.city}` : ""}
                    </div>
                  </td>
                  <td>
                    <ItemThumbs items={o.items} />
                    <div className="cell-sub">
                      {units} unit{units === 1 ? "" : "s"}
                    </div>
                  </td>
                  <td className="mono">{inr(o.total)}</td>
                  <td>
                    <span className={`pill ${statusPillClass(o.status)}`}>{o.status}</span>
                    {o.trackingNumber && <div className="cell-sub mono">{o.trackingNumber}</div>}
                  </td>
                  <td>
                    <span className={`pill ${paymentPillClass(o.payment.status)}`}>{o.payment.status}</span>
                  </td>
                  <td>
                    {new Date(o.createdAt).toLocaleDateString("en-IN")}
                    <div className="cell-sub">
                      {new Date(o.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </td>
                  <td className="row-actions">
                    <button type="button" onClick={() => setSelectedId(o._id)}>
                      View
                    </button>
                  </td>
                </tr>
              );
            })}
            {!loading && orders.length === 0 && (
              <tr>
                <td colSpan={8} className="empty-row">
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
    </div>
  );
}

// useSearchParams needs a Suspense boundary under the app router.
export default function OrdersPage() {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <OrdersPageInner />
    </Suspense>
  );
}
