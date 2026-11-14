"use client";

/* eslint-disable @next/next/no-img-element -- order item images are arbitrary API-supplied URLs */

// Order details — Figma "Orders 3". Opened from the orders table via `?tab=orders&order={id}`.

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { ApiRequestError, useAuth } from "../../lib/auth/authStore";
import { STATUS_TONE_CLASS, itemCount, orderStatus, productsLabel, type Order, type OrderAddress, type OrderStatus } from "./orders";
import { ErrorText, formatInr, inputClass, labelClass, outlineButtonClass, redButtonClass } from "./ui";

const STEPS = [
  { label: "Order Placed", icon: "/account/step-placed.svg" },
  { label: "Packaging", icon: "/account/step-packaging.svg" },
  { label: "On The Road", icon: "/account/step-shipped.svg" },
  { label: "Delivered", icon: "/account/step-delivered.svg" },
];

/** Index of the last reached tracking step, or null when the order left the normal flow. */
function reachedStep(status: OrderStatus): number | null {
  switch (status) {
    case "placed":
      return 0;
    case "confirmed":
      return 1;
    case "shipped":
      return 2;
    case "delivered":
      return 3;
    default:
      return null;
  }
}

function placedAt(date: string) {
  const d = new Date(date);
  const day = d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }).replace(/ (\d{4})$/, ", $1");
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${day} at ${time}`;
}

function Tracker({ step }: { step: number }) {
  return (
    <div className="flex w-full flex-col items-center gap-6">
      {/* Bar + dots span the step columns' centres: 1/8 in from each edge of a 4-column grid. */}
      <div className="relative mx-[12.5%] h-6 w-3/4" aria-hidden="true">
        <div className="absolute top-1/2 right-0 left-0 h-2 -translate-y-1/2 bg-white" />
        <div className="absolute top-1/2 left-0 h-2 -translate-y-1/2 bg-[#c10e12]" style={{ width: `${(step / 3) * 100}%` }} />
        {STEPS.map((s, i) => (
          <span
            key={s.label}
            className={`absolute top-0 size-6 -translate-x-1/2 rounded-full border-2 ${
              i <= step ? "border-[#c10e12] bg-[#c10e12]" : "border-[#c10e12] bg-[#3a3a3a]"
            }`}
            style={{ left: `${(i / 3) * 100}%` }}
          />
        ))}
      </div>
      <ol className="m-0 grid w-full list-none grid-cols-4 p-0">
        {STEPS.map((s, i) => (
          <li key={s.label} className={`flex flex-col items-center gap-3 ${i > step ? "opacity-50" : ""}`} aria-current={i === step ? "step" : undefined}>
            <Image src={s.icon} alt="" width={32} height={32} />
            <span className="text-center font-sans text-xs leading-5 font-medium text-paper sm:text-sm">{s.label}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function AddressColumn({ title, address, email }: { title: string; address: OrderAddress; email?: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6">
      <h3 className="m-0 font-sans text-lg leading-6 font-medium text-paper">{title}</h3>
      <div className="flex flex-col gap-3 font-sans text-sm leading-5">
        <div className="flex flex-col gap-2">
          <span className="font-medium text-paper">{address.name}</span>
          <span className="text-[#c9c9c9]">
            {address.line1}
            {address.line2 && `, ${address.line2}`}, {address.city}, {address.state} - {address.pincode}
          </span>
        </div>
        <span>
          <span className="text-paper">Phone Number:</span> <span className="text-[#c9c9c9]">+91 {address.mobile}</span>
        </span>
        {email && (
          <span className="break-all">
            <span className="text-paper">Email:</span> <span className="text-[#c9c9c9]">{email}</span>
          </span>
        )}
      </div>
    </div>
  );
}

const divider = <span aria-hidden="true" className="hidden w-px self-stretch bg-[#8f8f8f] md:block" />;

function ReviewForm({ order, onDone }: { order: Order; onDone: () => void }) {
  const { authFetch } = useAuth();
  // One entry per distinct product (an order can hold several sizes/colours of the same product).
  const products = [...new Map(order.items.filter((i) => i.product).map((i) => [i.product!, i.productName])).entries()];
  const [product, setProduct] = useState(products[0]?.[0] ?? "");
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (products.length === 0) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) return setError("Pick a star rating.");
    setBusy(true);
    setError(null);
    try {
      await authFetch("/reviews", {
        method: "POST",
        body: JSON.stringify({ product, order: order._id, rating, title: title.trim() || undefined, body: body.trim() || undefined }),
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Couldn't submit your review.");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="flex w-full items-center justify-between gap-4 bg-[#111] p-6 font-sans text-sm text-paper">
        Thanks! Your review will appear once it&apos;s approved.
        <button type="button" onClick={onDone} className={outlineButtonClass}>
          Close
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex w-full flex-col gap-4 bg-[#111] p-6">
      <h3 className="m-0 font-sans text-lg font-medium text-paper">Leave a Rating</h3>
      {products.length > 1 && (
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Product</span>
          <select value={product} onChange={(e) => setProduct(e.target.value)} className={inputClass}>
            {products.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
      )}
      <div role="radiogroup" aria-label="Rating" className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            onClick={() => setRating(n)}
            className={`text-3xl leading-none ${n <= rating ? "text-gold" : "text-paper/25"} hover:text-gold`}
          >
            ★
          </button>
        ))}
      </div>
      <input placeholder="Title (optional)" maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
      <textarea
        placeholder="Tell others what you thought (optional)"
        maxLength={3000}
        rows={4}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className={`${inputClass} h-auto py-3`}
      />
      <ErrorText>{error}</ErrorText>
      <div className="flex gap-3">
        <button type="button" onClick={onDone} className={outlineButtonClass}>
          Cancel
        </button>
        <button type="submit" disabled={busy} className={`${redButtonClass} px-6`}>
          {busy ? "Submitting…" : "Submit Review"}
        </button>
      </div>
    </form>
  );
}

export default function OrderDetail({ orderId, onBack }: { orderId: string; onBack: () => void }) {
  const { authFetch, user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    authFetch<{ order: Order }>(`/orders/${orderId}`)
      .then(({ order }) => setOrder(order))
      .catch(() => setError("Couldn't load this order."));
  }, [authFetch, orderId]);

  useEffect(load, [load]);

  const cancel = async () => {
    if (!order || !window.confirm(`Cancel order ${order.orderNumber}?`)) return;
    setBusy(true);
    setError(null);
    try {
      await authFetch(`/orders/${order._id}/cancel`, { method: "POST", body: JSON.stringify({}) });
      load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Couldn't cancel the order.");
    } finally {
      setBusy(false);
    }
  };

  const header = (
    <div className="relative flex h-13 w-full items-center justify-between gap-3 rounded-t bg-[#141414] pr-4.5 pl-6">
      <button type="button" onClick={onBack} className="flex items-center gap-3 font-sans text-sm leading-5 font-medium text-paper uppercase">
        <Image src="/account/arrow-left.svg" alt="" width={24} height={24} />
        Order Details
      </button>
      {order?.status === "delivered" && !rating && (
        <button
          type="button"
          onClick={() => setRating(true)}
          className="flex items-center justify-center gap-2 bg-[#c10e12] px-4 py-1.5 font-sans text-sm leading-5 font-semibold text-paper hover:opacity-90 sm:w-41"
        >
          Leave a Rating
          <Image src="/account/plus-duotone.svg" alt="" width={20} height={20} />
        </button>
      )}
    </div>
  );

  if (!order) {
    return (
      <div className="mx-auto flex w-full max-w-[984px] flex-col gap-2.5">
        {header}
        {error ? <ErrorText>{error}</ErrorText> : <p className="m-0 p-6 font-sans text-sm text-paper/40">Loading…</p>}
      </div>
    );
  }

  const step = reachedStep(order.status);
  const status = orderStatus(order);
  const count = itemCount(order);
  const cancellable = order.status === "placed" || order.status === "confirmed";
  const lastUpdate = order.statusHistory?.at(-1);
  const email = order.guestEmail ?? user?.email;

  return (
    <div className="mx-auto flex w-full max-w-[984px] flex-col items-stretch gap-2.5 overflow-hidden rounded">
      {header}

      {rating && <ReviewForm order={order} onDone={() => setRating(false)} />}

      <section className="flex flex-col gap-6 bg-[#111] p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded bg-[#252525] p-4 sm:p-6">
          <div className="flex flex-col gap-2 font-sans">
            <span className="text-xl leading-7 text-paper">#{order.orderNumber}</span>
            <span className="flex flex-col gap-1 text-sm leading-5 text-[#e4e4e4] sm:flex-row sm:gap-2">
              <span>{productsLabel(count)}</span>
              <span aria-hidden="true" className="hidden sm:inline">
                •
              </span>
              <span>Order Placed on {placedAt(order.createdAt)}</span>
            </span>
          </div>
          <span className="font-sans text-2xl leading-8 font-semibold whitespace-nowrap text-[#dcdcdc] sm:text-[1.75rem]">
            INR {order.total.toFixed(2)}
          </span>
        </div>

        <p className="m-0 font-sans text-sm leading-5 text-[#e8e8e8]">
          {order.trackingNumber ? (
            <>
              Tracking: <span className="font-medium text-paper">{[order.courierPartner, order.trackingNumber].filter(Boolean).join(" · ")}</span>
            </>
          ) : (
            <>
              Status: <span className={`font-medium ${STATUS_TONE_CLASS[status.tone]}`}>{status.label}</span>
              {lastUpdate && <> · updated {placedAt(lastUpdate.timestamp)}</>}
            </>
          )}
        </p>

        {step !== null && order.payment.status !== "failed" && <Tracker step={step} />}

        {cancellable && (
          <button type="button" onClick={cancel} disabled={busy} className={`${outlineButtonClass} self-start`}>
            {busy ? "Cancelling…" : "Cancel Order"}
          </button>
        )}
        <ErrorText>{error}</ErrorText>
      </section>

      <section className="flex flex-col gap-6 py-8">
        <div className="flex flex-col gap-5">
          <h3 className="m-0 font-sans text-lg leading-6 font-medium text-paper">
            Product <span className="font-normal text-[#c9c9c9]">({String(order.items.length).padStart(2, "0")})</span>
          </h3>
          <div
            aria-hidden="true"
            className="hidden border border-[#dfdfdf] bg-[#c10e12] px-6 py-2.5 font-sans text-xs leading-normal font-medium text-[#f2f2f2] uppercase md:grid md:grid-cols-[1fr_7.75rem_7.75rem_12rem] md:gap-x-6"
          >
            <span>Products</span>
            <span>Price</span>
            <span>Quantity</span>
            <span>Sub-Total</span>
          </div>
        </div>
        <ul className="m-0 flex list-none flex-col gap-4 border-t border-[#3a3a3a] p-0 pt-4">
          {order.items.map((item) => (
            <li
              key={item.variantSku}
              className="grid grid-cols-[1fr_auto] items-center gap-x-4 font-sans text-sm leading-5 text-paper md:grid-cols-[1fr_7.75rem_7.75rem_12rem] md:gap-x-6 md:px-6"
            >
              <div className="flex min-w-0 items-center gap-4">
                {item.variantImage ? (
                  <img src={item.variantImage} alt="" className="size-16 shrink-0 rounded bg-[#c4c4c4] object-cover md:size-20" />
                ) : (
                  <span className="size-16 shrink-0 rounded bg-[#c4c4c4] md:size-20" />
                )}
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="text-xs leading-4 font-semibold text-[#dcdcdc]">
                    {item.variantColor} · {item.variantSize}
                  </span>
                  <span>{item.productName}</span>
                  {/* Phones: price × qty under the name; the columns take over from md. */}
                  <span className="text-xs text-[#c9c9c9] md:hidden">
                    {formatInr(item.unitPrice)} × {item.quantity}
                  </span>
                </div>
              </div>
              <span className="hidden font-medium md:block">{formatInr(item.unitPrice)}</span>
              <span className="hidden md:block">x{item.quantity}</span>
              <span className="font-medium whitespace-nowrap">{formatInr(item.totalPrice)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-6 border border-[#8f8f8f] bg-[#181818] px-6 py-8 md:flex-row">
        {/* Checkout collects one address, so billing is the shipping address. */}
        <AddressColumn title="Billing Address" address={order.shippingAddress} email={email} />
        {divider}
        <AddressColumn title="Shipping Address" address={order.shippingAddress} email={email} />
        {divider}
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <h3 className="m-0 font-sans text-lg leading-6 font-medium text-paper">Order Notes</h3>
          <p className="m-0 font-sans text-sm leading-5 text-[#c9c9c9]">{order.deliveryInstructions || "No notes for this order."}</p>
        </div>
      </section>
    </div>
  );
}
