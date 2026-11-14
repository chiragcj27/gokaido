"use client";

// My Orders — Figma "Orders 1" (empty state) and "Orders 2" (recent orders table).

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ErrorText, formatDateTime, formatInr, redButtonClass } from "./ui";
import { STATUS_TONE_CLASS, itemCount, orderStatus, productsLabel, useOrders } from "./orders";

const RECENT_LIMIT = 7;

// Proportional columns (the design's 124/152/200/248/auto at 1600px) so the table fits any
// content width instead of overflowing below the Figma frame size.
const rowGrid =
  "lg:grid lg:grid-cols-[minmax(9.5rem,1.1fr)_minmax(7.5rem,1fr)_minmax(9.5rem,1.25fr)_minmax(9rem,1.5fr)_7.5rem] lg:gap-x-6 lg:items-center 2xl:gap-x-12";

function EmptyOrders() {
  return (
    <div className="flex flex-col items-center px-4 py-16 text-center">
      <Image src="/account/empty-orders.svg" alt="" width={96} height={96} />
      <h2 className="m-0 pt-6 font-heading text-2xl leading-9 font-normal text-paper sm:text-[1.875rem]">No Orders Yet</h2>
      <p className="m-0 max-w-md pt-4 pb-8 font-heading text-base leading-6 text-[#fefefe]">
        You haven&apos;t placed any orders yet. Start shopping to see your orders here.
      </p>
      <Link href="/collections" className={`${redButtonClass} px-8 no-underline`}>
        Start Shopping
      </Link>
    </div>
  );
}

export default function OrdersTab({ onOpenOrder }: { onOpenOrder: (id: string) => void }) {
  const { orders, error } = useOrders();
  const [showAll, setShowAll] = useState(false);

  if (error) return <ErrorText>{error}</ErrorText>;
  if (orders === null) return <p className="m-0 py-6 font-sans text-sm text-paper/40">Loading…</p>;
  if (orders.length === 0) return <EmptyOrders />;

  const visible = showAll ? orders : orders.slice(0, RECENT_LIMIT);

  return (
    <section className="flex flex-col gap-3 rounded bg-black pb-3 2xl:px-6">
      <div className="flex h-13 items-center justify-between px-4 lg:px-6">
        <h2 className="m-0 font-sans text-sm leading-5 font-medium text-paper uppercase">
          {showAll ? "All Orders" : "Recent Orders"}
        </h2>
        {orders.length > RECENT_LIMIT && (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="flex items-center gap-2 py-1.5 font-sans text-sm leading-5 font-semibold text-[#f21b1b] hover:opacity-80"
          >
            {showAll ? "Show Recent" : "View All"}
            <Image src="/account/arrow-right-lg.svg" alt="" width={20} height={20} />
          </button>
        )}
      </div>

      <div className="flex flex-col">
        <div
          aria-hidden="true"
          className={`hidden bg-[#262626] px-6 py-2.5 font-sans text-xs leading-normal font-medium text-[#e5e5e5] uppercase ${rowGrid}`}
        >
          <span>Order ID</span>
          <span>Status</span>
          <span>Date</span>
          <span>Total</span>
          <span>Action</span>
        </div>

        <ul className="m-0 list-none p-0">
          {visible.map((order) => {
            const { label, tone } = orderStatus(order);
            return (
              <li
                key={order._id}
                className={`grid grid-cols-2 gap-x-4 gap-y-1 border-t border-[#565656] px-4 py-3 font-sans text-sm leading-5 lg:px-6 ${rowGrid}`}
              >
                <span className="font-medium whitespace-nowrap text-paper">#{order.orderNumber}</span>
                <span className={`text-right font-semibold uppercase lg:text-left ${STATUS_TONE_CLASS[tone]}`}>{label}</span>
                <span className="text-[#ababab]">{formatDateTime(order.createdAt)}</span>
                <span className="text-right text-[#e5e5e5] lg:text-left">
                  {formatInr(order.total)} ({productsLabel(itemCount(order))})
                </span>
                <button
                  type="button"
                  onClick={() => onOpenOrder(order._id)}
                  className="col-span-2 mt-1 flex items-center gap-2 justify-self-start font-semibold whitespace-nowrap text-[#c10e12] hover:opacity-80 lg:col-span-1 lg:mt-0"
                >
                  View Details
                  <Image src="/account/arrow-right.svg" alt="" width={16} height={16} />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
