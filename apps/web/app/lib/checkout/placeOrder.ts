"use client";

// Places an order and hands the browser to ICICI's hosted payment page
// (Standard/redirect flow — see CLAUDE.md "Payment Gateway").
//
// The storefront cart lives in localStorage, but `POST /api/orders` builds the
// order from the *server* Cart (that's where prices, stock and coupons are
// validated), so the local cart is mirrored into it first: cleared, then
// re-added line by line. Logged-in customers own their cart by token; guests
// by a random `X-Guest-Id` kept in localStorage.
//
// The local cart is deliberately NOT cleared here — only once the return page
// sees a successful payment, so a failed/abandoned payment leaves the bag
// intact for another attempt.

import { ApiRequestError, apiRequest } from "../auth/authStore";
import type { CartItem } from "../cartStore";
import type { CustomerInfo } from "../../components/Checkout/CustomerInfoStep";

const GUEST_ID_KEY = "gokaido:guest-id";
const PENDING_ORDER_KEY = "gokaido:pending-order";

type Request = <T>(path: string, init?: RequestInit) => Promise<T>;

export interface PendingOrder {
  orderNumber: string;
  total: number;
  email: string;
}

interface CreateOrderResponse {
  order: { orderNumber: string; total: number };
  redirectURI: string;
  tranCtx: string;
}

function getGuestId(): string {
  try {
    const existing = localStorage.getItem(GUEST_ID_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem(GUEST_ID_KEY, id);
    return id;
  } catch {
    // Storage blocked — a per-attempt id still works, the cart is rebuilt on every checkout anyway.
    return crypto.randomUUID();
  }
}

/** Request function for a guest: unauthenticated, scoped by the persistent guest id. */
export function guestRequest(): Request {
  const guestId = getGuestId();
  return (path, init = {}) => apiRequest(path, { ...init, headers: { ...init.headers, "X-Guest-Id": guestId } });
}

/** "+91 98765 43210" / "098765 43210" → "9876543210" (the API wants exactly 10 digits). */
export function normalizeMobile(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits;
}

/** Client-side mirror of the API's address rules, so obvious mistakes don't cost a round trip. */
export function validateCustomerInfo(info: CustomerInfo): string | null {
  if (!/^[6-9]\d{9}$/.test(normalizeMobile(info.phone))) return "Enter a valid 10-digit Indian mobile number.";
  if (!/^\S+@\S+\.\S+$/.test(info.email.trim())) return "Enter a valid email address.";
  if (!/^[1-9]\d{5}$/.test(info.pincode.trim())) return "Enter a valid 6-digit pincode.";
  return null;
}

async function syncServerCart(request: Request, items: CartItem[]) {
  const unorderable = items.find((item) => !item.productId);
  if (unorderable) {
    throw new Error(`"${unorderable.name}" can't be ordered any more — please remove it and add it again from its product page.`);
  }

  await request("/cart", { method: "DELETE" });
  for (const item of items) {
    try {
      await request("/cart/items", {
        method: "POST",
        body: JSON.stringify({ productId: item.productId, variantSku: item.id, quantity: item.quantity }),
      });
    } catch (err) {
      if (err instanceof ApiRequestError) throw new Error(`${item.name} (${item.size}): ${err.message}`);
      throw err;
    }
  }
}

export async function placeOrderAndPay({
  request,
  isGuest,
  items,
  customer,
}: {
  request: Request;
  isGuest: boolean;
  items: CartItem[];
  customer: CustomerInfo;
}): Promise<void> {
  await syncServerCart(request, items);

  const { order, redirectURI, tranCtx } = await request<CreateOrderResponse>("/orders", {
    method: "POST",
    body: JSON.stringify({
      shippingAddress: {
        name: customer.fullName.trim(),
        mobile: normalizeMobile(customer.phone),
        line1: customer.address.trim(),
        city: customer.city.trim(),
        state: customer.state.trim(),
        pincode: customer.pincode.trim(),
      },
      ...(isGuest && { guestName: customer.fullName.trim(), guestEmail: customer.email.trim() }),
    }),
  });

  // Survives the round trip through ICICI (same tab), so the return page can show the total.
  try {
    const pending: PendingOrder = { orderNumber: order.orderNumber, total: order.total, email: customer.email.trim() };
    sessionStorage.setItem(PENDING_ORDER_KEY, JSON.stringify(pending));
  } catch {
    // Return page falls back to showing just the order number.
  }

  window.location.assign(`${redirectURI}?tranCtx=${encodeURIComponent(tranCtx)}`);
}

export function readPendingOrder(orderNumber: string): PendingOrder | null {
  try {
    const raw = sessionStorage.getItem(PENDING_ORDER_KEY);
    const pending = raw ? (JSON.parse(raw) as PendingOrder) : null;
    return pending?.orderNumber === orderNumber ? pending : null;
  } catch {
    return null;
  }
}
