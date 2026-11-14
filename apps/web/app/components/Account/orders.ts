"use client";

// Order types + helpers shared by the orders table, the order-detail view and Overview.

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../lib/auth/authStore";

export interface OrderItem {
  product?: string;
  productName: string;
  variantSku: string;
  variantColor: string;
  variantSize: string;
  variantImage: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface OrderAddress {
  name: string;
  mobile: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

export type OrderStatus = "placed" | "confirmed" | "shipped" | "delivered" | "cancelled" | "refund_initiated" | "refunded";

export interface Order {
  _id: string;
  orderNumber: string;
  createdAt: string;
  status: OrderStatus;
  statusHistory?: { status: OrderStatus; timestamp: string; note?: string }[];
  subtotal: number;
  deliveryCharge: number;
  couponCode?: string;
  couponDiscount: number;
  rewardPointsValue: number;
  total: number;
  items: OrderItem[];
  shippingAddress: OrderAddress;
  deliveryInstructions?: string;
  guestEmail?: string;
  payment: { status: string };
  trackingNumber?: string;
  courierPartner?: string;
}

export function useOrders() {
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

export type StatusTone = "progress" | "completed" | "cancelled";

/** Customer-facing status label + the design's colour group (in progress / completed / canceled). */
export function orderStatus(order: Pick<Order, "status" | "payment">): { label: string; tone: StatusTone } {
  if (order.payment.status === "failed") return { label: "Payment failed", tone: "cancelled" };
  if (order.payment.status === "pending" && order.status === "placed") return { label: "Awaiting payment", tone: "progress" };
  switch (order.status) {
    case "delivered":
      return { label: "Completed", tone: "completed" };
    case "cancelled":
      return { label: "Canceled", tone: "cancelled" };
    case "refund_initiated":
      return { label: "Refund initiated", tone: "cancelled" };
    case "refunded":
      return { label: "Refunded", tone: "cancelled" };
    case "shipped":
      return { label: "Shipped", tone: "progress" };
    default:
      return { label: "In progress", tone: "progress" };
  }
}

export const STATUS_TONE_CLASS: Record<StatusTone, string> = {
  progress: "text-[#f21b1b]",
  completed: "text-[#2db224]",
  cancelled: "text-[#ee5858]",
};

export const itemCount = (order: Pick<Order, "items">) => order.items.reduce((n, i) => n + i.quantity, 0);

export const productsLabel = (n: number) => `${n} Product${n === 1 ? "" : "s"}`;
