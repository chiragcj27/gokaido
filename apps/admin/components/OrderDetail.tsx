"use client";

import { useState } from "react";
import { api, ApiError } from "../lib/api";
import type { Order, OrderStatus } from "../lib/types";

const STATUS_LABELS: Record<OrderStatus, string> = {
  placed: "Placed",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refund_initiated: "Refund initiated",
  refunded: "Refunded",
};

// Mirrors the server's ALLOWED_STATUS_TRANSITIONS (apps/api/src/controllers/order.controller.ts)
// — only used here to populate the dropdown; the server re-validates regardless.
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  placed: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled", "refund_initiated"],
  shipped: ["delivered", "refund_initiated"],
  delivered: ["refund_initiated"],
  cancelled: [],
  refund_initiated: ["refunded"],
  refunded: [],
};

function statusPillClass(status: OrderStatus): string {
  if (status === "delivered") return "pill-active";
  if (status === "cancelled") return "pill-danger";
  if (status === "refunded") return "pill-inactive";
  return "pill-warning";
}

function paymentPillClass(status: string): string {
  if (status === "paid") return "pill-active";
  if (status === "failed" || status === "cancelled") return "pill-danger";
  if (status === "refunded") return "pill-inactive";
  return "pill-warning";
}

interface Props {
  order: Order;
  onBack: () => void;
  onUpdated: (order: Order) => void;
}

export default function OrderDetail({ order, onBack, onUpdated }: Props) {
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber ?? "");
  const [courierPartner, setCourierPartner] = useState(order.courierPartner ?? "");
  const [nextStatus, setNextStatus] = useState<OrderStatus | "">("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const allowedNext = ALLOWED_TRANSITIONS[order.status];
  const customer = typeof order.user === "object" ? order.user : undefined;
  const customerName = order.guestName ?? customer?.name ?? "—";
  const customerMobile = order.guestMobile ?? customer?.mobile ?? "—";
  const customerEmail = order.guestEmail ?? customer?.email;

  async function handleSaveTracking(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await api.patch<{ order: Order }>(`/api/admin/orders/${order._id}`, {
        trackingNumber: trackingNumber || undefined,
        courierPartner: courierPartner || undefined,
      });
      onUpdated(res.order);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save tracking info");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusUpdate() {
    if (!nextStatus) return;
    setError(null);
    setSaving(true);
    try {
      const res = await api.patch<{ order: Order }>(`/api/admin/orders/${order._id}`, {
        status: nextStatus,
        note: note || undefined,
      });
      onUpdated(res.order);
      setNextStatus("");
      setNote("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update status");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <button type="button" className="link-button" onClick={onBack}>
            ← Back to orders
          </button>
          <h1>{order.orderNumber}</h1>
        </div>
        <div className="pill-group">
          <span className={`pill ${statusPillClass(order.status)}`}>{STATUS_LABELS[order.status]}</span>
          <span className={`pill ${paymentPillClass(order.payment.status)}`}>{order.payment.status}</span>
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="detail-grid">
        <div>
          <div className="panel">
            <h2>Items</h2>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Variant</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, i) => (
                    <tr key={i}>
                      <td>{item.productName}</td>
                      <td className="mono">
                        {item.variantColor} / {item.variantSize}
                      </td>
                      <td className="mono">{item.quantity}</td>
                      <td className="mono">₹{item.unitPrice}</td>
                      <td className="mono">₹{item.totalPrice}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              <div className="summary-row">
                <span>Subtotal</span>
                <span className="mono">₹{order.subtotal}</span>
              </div>
              {order.couponDiscount > 0 && (
                <div className="summary-row">
                  <span>Coupon{order.couponCode ? ` (${order.couponCode})` : ""}</span>
                  <span className="mono">−₹{order.couponDiscount}</span>
                </div>
              )}
              <div className="summary-row">
                <span>Delivery</span>
                <span className="mono">₹{order.deliveryCharge}</span>
              </div>
              <div className="summary-row total">
                <span>Total</span>
                <span className="mono">₹{order.total}</span>
              </div>
            </div>
          </div>

          <div className="panel">
            <h2>Fulfillment</h2>
            <form onSubmit={handleSaveTracking} className="form-grid">
              <label>
                Tracking number
                <input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} />
              </label>
              <label>
                Courier partner
                <input value={courierPartner} onChange={(e) => setCourierPartner(e.target.value)} />
              </label>
              <div className="full-width">
                <button type="submit" disabled={saving}>
                  Save tracking info
                </button>
              </div>
            </form>
          </div>

          {allowedNext.length > 0 && (
            <div className="panel">
              <h2>Update status</h2>
              <div className="form-grid">
                <label>
                  New status
                  <select
                    value={nextStatus}
                    onChange={(e) => setNextStatus(e.target.value as OrderStatus)}
                  >
                    <option value="">Select…</option>
                    {allowedNext.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Note (optional)
                  <input value={note} onChange={(e) => setNote(e.target.value)} />
                </label>
              </div>
              <button type="button" onClick={handleStatusUpdate} disabled={!nextStatus || saving}>
                {saving ? "Updating…" : "Update status"}
              </button>
            </div>
          )}
        </div>

        <div>
          <div className="panel">
            <h2>Customer</h2>
            <div className="address-block">
              {customerName}
              <br />
              {customerMobile}
              <br />
              {customerEmail && (
                <>
                  {customerEmail}
                  <br />
                </>
              )}
              {!customer && "Guest checkout"}
            </div>
          </div>

          <div className="panel">
            <h2>Shipping address</h2>
            <div className="address-block">
              {order.shippingAddress.name}
              <br />
              {order.shippingAddress.line1}
              <br />
              {order.shippingAddress.line2 && (
                <>
                  {order.shippingAddress.line2}
                  <br />
                </>
              )}
              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}
              <br />
              {order.shippingAddress.mobile}
            </div>
          </div>

          <div className="panel">
            <h2>History</h2>
            <ul className="timeline">
              {[...order.statusHistory].reverse().map((h, i) => (
                <li key={i}>
                  <span className="timeline-status">{STATUS_LABELS[h.status]}</span>
                  <span className="timeline-meta">{new Date(h.timestamp).toLocaleString()}</span>
                  {h.note && <span className="timeline-meta">{h.note}</span>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
