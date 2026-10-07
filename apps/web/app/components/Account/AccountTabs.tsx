"use client";

/* eslint-disable @next/next/no-img-element -- product/order images come from arbitrary API-supplied URLs */

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ApiRequestError, useAuth, type AuthUser } from "../../lib/auth/authStore";
import { ErrorText, Panel, PanelTitle, formatDate, formatPrice, outlineButtonClass } from "./ui";

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

interface OrderItem {
  productName: string;
  variantSku: string;
  variantColor: string;
  variantSize: string;
  variantImage: string;
  quantity: number;
  totalPrice: number;
}

interface Order {
  _id: string;
  orderNumber: string;
  createdAt: string;
  status: string;
  total: number;
  items: OrderItem[];
  payment: { status: string };
  trackingNumber?: string;
  courierPartner?: string;
}

const STATUS_LABEL: Record<string, string> = {
  placed: "Placed",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refund_initiated: "Refund initiated",
  refunded: "Refunded",
};

function useOrders() {
  const { authFetch } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    authFetch<{ orders: Order[] }>("/orders")
      .then(({ orders }) => setOrders(orders))
      .catch(() => setError("Couldn't load your orders."));
  }, [authFetch]);

  useEffect(load, [load]);
  return { orders, error, reload: load };
}

function statusText(order: Order) {
  if (order.payment.status === "pending" && order.status === "placed") return "Awaiting payment";
  if (order.payment.status === "failed") return "Payment failed";
  return STATUS_LABEL[order.status] ?? order.status;
}

function OrderCard({ order, onChanged }: { order: Order; onChanged: () => void }) {
  const { authFetch } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cancellable = order.status === "placed" || order.status === "confirmed";

  const cancel = async () => {
    if (!window.confirm(`Cancel order ${order.orderNumber}?`)) return;
    setBusy(true);
    setError(null);
    try {
      await authFetch(`/orders/${order._id}/cancel`, { method: "POST", body: JSON.stringify({}) });
      onChanged();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Couldn't cancel the order.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel className="flex flex-col gap-4">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex flex-wrap items-center justify-between gap-3 text-left" aria-expanded={open}>
        <span className="flex flex-col gap-1">
          <span className="font-heading text-xs font-bold text-paper">#{order.orderNumber}</span>
          <span className="font-sans text-[0.65rem] text-paper/50">
            {formatDate(order.createdAt)} · {order.items.length} item{order.items.length === 1 ? "" : "s"}
          </span>
        </span>
        <span className="flex items-center gap-4">
          <span className="rounded-sm border border-white/15 px-2 py-1 font-heading text-[0.6rem] font-bold tracking-[0.06em] text-paper/80 uppercase">
            {statusText(order)}
          </span>
          <span className="font-heading text-sm font-bold text-paper">{formatPrice(order.total)}</span>
          <span aria-hidden="true" className={`text-paper/60 transition-transform ${open ? "rotate-90" : ""}`}>
            &gt;
          </span>
        </span>
      </button>

      {open && (
        <div className="flex flex-col gap-3 border-t border-white/10 pt-4">
          {order.items.map((item) => (
            <div key={item.variantSku} className="flex items-center gap-3">
              {item.variantImage ? (
                <img src={item.variantImage} alt="" className="size-14 rounded-md bg-black object-cover" />
              ) : (
                <span className="size-14 rounded-md bg-black" />
              )}
              <span className="flex flex-1 flex-col">
                <span className="font-sans text-sm text-paper">{item.productName}</span>
                <span className="font-sans text-[0.65rem] text-paper/50">
                  {item.variantColor} · {item.variantSize} · Qty {item.quantity}
                </span>
              </span>
              <span className="font-sans text-sm text-paper">{formatPrice(item.totalPrice)}</span>
            </div>
          ))}
          {order.trackingNumber && (
            <p className="m-0 font-sans text-xs text-paper/60">
              Tracking: {order.courierPartner} {order.trackingNumber}
            </p>
          )}
          <ErrorText>{error}</ErrorText>
          {cancellable && (
            <button type="button" onClick={cancel} disabled={busy} className={`${outlineButtonClass} self-start`}>
              {busy ? "Cancelling…" : "Cancel Order"}
            </button>
          )}
        </div>
      )}
    </Panel>
  );
}

export function OrdersTab() {
  const { orders, error, reload } = useOrders();

  return (
    <div className="flex flex-col gap-4">
      <Panel>
        <PanelTitle>My Orders</PanelTitle>
      </Panel>
      <ErrorText>{error}</ErrorText>
      {orders === null ? (
        !error && <p className="m-0 font-sans text-xs text-paper/40">Loading…</p>
      ) : orders.length === 0 ? (
        <Panel className="flex flex-col items-start gap-3">
          <p className="m-0 font-sans text-sm text-paper/50">You haven&apos;t placed any orders yet.</p>
          <Link href="/collections" className={outlineButtonClass}>
            Start Shopping
          </Link>
        </Panel>
      ) : (
        orders.map((order) => <OrderCard key={order._id} order={order} onChanged={reload} />)
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Wishlist
// ---------------------------------------------------------------------------

interface WishlistProduct {
  _id: string;
  name: string;
  slug: string;
  images?: string[];
  isActive: boolean;
  variants?: { basePrice: number; images?: string[] }[];
}

export function WishlistTab() {
  const { authFetch } = useAuth();
  const [items, setItems] = useState<WishlistProduct[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    authFetch<{ wishlist: WishlistProduct[] }>("/users/me/wishlist")
      .then(({ wishlist }) => setItems(wishlist))
      .catch(() => setError("Couldn't load your wishlist."));
  }, [authFetch]);

  useEffect(load, [load]);

  const remove = async (id: string) => {
    setItems((list) => list?.filter((p) => p._id !== id) ?? null);
    try {
      await authFetch(`/users/me/wishlist/${id}`, { method: "DELETE" });
    } catch {
      setError("Couldn't remove the item.");
      load();
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Panel>
        <PanelTitle>Wishlist</PanelTitle>
      </Panel>
      <ErrorText>{error}</ErrorText>
      {items === null ? (
        !error && <p className="m-0 font-sans text-xs text-paper/40">Loading…</p>
      ) : items.length === 0 ? (
        <Panel>
          <p className="m-0 font-sans text-sm text-paper/50">Your wishlist is empty.</p>
        </Panel>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {items.map((p) => {
            const image = p.images?.[0] ?? p.variants?.[0]?.images?.[0];
            const price = p.variants?.length ? Math.min(...p.variants.map((v) => v.basePrice)) : null;
            return (
              <Panel key={p._id} className="flex flex-col gap-3 !p-3">
                <Link href={`/products/${p.slug}`} className="flex flex-col gap-2">
                  {image ? (
                    <img src={image} alt="" className="aspect-square w-full rounded-md bg-black object-cover" />
                  ) : (
                    <span className="aspect-square w-full rounded-md bg-black" />
                  )}
                  <span className="font-sans text-sm text-paper">{p.name}</span>
                  {price !== null && <span className="font-heading text-xs font-bold text-paper/80">{formatPrice(price)}</span>}
                  {!p.isActive && <span className="font-sans text-[0.65rem] text-paper/40">No longer available</span>}
                </Link>
                <button type="button" onClick={() => remove(p._id)} className="self-start font-heading text-[0.6rem] font-bold tracking-[0.06em] text-paper/60 uppercase hover:text-red">
                  Remove
                </button>
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------

export function OverviewTab({ onShowOrders }: { onShowOrders: () => void }) {
  const { user } = useAuth();
  const { orders } = useOrders();
  const [copied, setCopied] = useState(false);
  if (!user) return null;

  const latest = orders?.[0];

  return (
    <div className="flex flex-col gap-4">
      <Panel>
        <PanelTitle>Welcome back, {user.name?.split(" ")[0]}</PanelTitle>
      </Panel>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Panel className="flex flex-col gap-2">
          <span className="font-sans text-[0.65rem] tracking-[0.06em] text-paper/50 uppercase">Reward Points</span>
          <span className="font-heading text-2xl font-extrabold text-gold">{user.rewardPoints}</span>
          <span className="font-sans text-[0.65rem] text-paper/40">1 point = ₹1 at checkout</span>
        </Panel>
        <Panel className="flex flex-col gap-2">
          <span className="font-sans text-[0.65rem] tracking-[0.06em] text-paper/50 uppercase">Orders</span>
          <span className="font-heading text-2xl font-extrabold text-paper">{orders ? orders.length : "–"}</span>
          <button type="button" onClick={onShowOrders} className="self-start font-sans text-[0.65rem] text-paper/60 underline hover:text-paper">
            View all
          </button>
        </Panel>
        <Panel className="flex flex-col gap-2">
          <span className="font-sans text-[0.65rem] tracking-[0.06em] text-paper/50 uppercase">Refer &amp; Earn</span>
          <span className="font-heading text-xl font-extrabold tracking-[0.08em] text-paper">{user.referralCode ?? "–"}</span>
          {user.referralCode && (
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(user.referralCode!).then(() => setCopied(true), () => {});
              }}
              className="self-start font-sans text-[0.65rem] text-paper/60 underline hover:text-paper"
            >
              {copied ? "Copied!" : "Copy code"}
            </button>
          )}
        </Panel>
      </div>
      {latest && (
        <Panel className="flex flex-wrap items-center justify-between gap-3">
          <span className="flex flex-col gap-1">
            <span className="font-sans text-[0.65rem] tracking-[0.06em] text-paper/50 uppercase">Latest Order</span>
            <span className="font-heading text-xs font-bold text-paper">
              #{latest.orderNumber} · {formatDate(latest.createdAt)}
            </span>
          </span>
          <span className="font-heading text-[0.65rem] font-bold tracking-[0.06em] text-paper/80 uppercase">{statusText(latest)}</span>
        </Panel>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

const LANGUAGES: { value: AuthUser["language"]; label: string }[] = [
  { value: "en", label: "English" },
  { value: "hi", label: "हिन्दी" },
  { value: "mr", label: "मराठी" },
  { value: "ta", label: "தமிழ்" },
];

const CHANNELS = [
  { key: "whatsapp", label: "WhatsApp", hint: "Order updates and offers on WhatsApp" },
  { key: "sms", label: "SMS", hint: "Order status by text message" },
  { key: "email", label: "Email", hint: "Order confirmations and invoices" },
] as const;

export function SettingsTab() {
  const { user, setUser, authFetch, logout } = useAuth();
  const [error, setError] = useState<string | null>(null);
  if (!user) return null;

  const notifications = user.notifications ?? { whatsapp: true, sms: true, email: true };

  const patch = async (body: object) => {
    setError(null);
    try {
      const res = await authFetch<{ user: AuthUser }>("/users/me", { method: "PATCH", body: JSON.stringify(body) });
      setUser(res.user);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Couldn't save your settings.");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Panel className="flex flex-col gap-4">
        <PanelTitle>Language</PanelTitle>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((l) => (
            <button
              key={l.value}
              type="button"
              onClick={() => patch({ language: l.value })}
              aria-pressed={user.language === l.value}
              className={`${outlineButtonClass} ${user.language === l.value ? "border-red text-paper" : "text-paper/60"}`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </Panel>

      <Panel className="flex flex-col gap-4">
        <PanelTitle>Notifications</PanelTitle>
        {CHANNELS.map((c) => (
          <label key={c.key} className="flex cursor-pointer items-center justify-between gap-4">
            <span className="flex flex-col">
              <span className="font-sans text-sm text-paper">{c.label}</span>
              <span className="font-sans text-[0.65rem] text-paper/50">{c.hint}</span>
            </span>
            <input
              type="checkbox"
              checked={notifications[c.key]}
              onChange={(e) => patch({ notifications: { [c.key]: e.target.checked } })}
              className="size-4 accent-red"
            />
          </label>
        ))}
      </Panel>

      <ErrorText>{error}</ErrorText>

      <Panel>
        <button type="button" onClick={logout} className="font-heading text-xs font-bold tracking-[0.06em] text-red uppercase hover:opacity-80">
          Log Out
        </button>
      </Panel>
    </div>
  );
}
