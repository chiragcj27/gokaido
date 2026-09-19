"use client";

import { useState } from "react";
import { FREE_SHIPPING_THRESHOLD } from "../../lib/cartStore";

export interface OrderSummaryProps {
  itemCount: number;
  subtotal: number;
  onApplyDiscount?: (code: string) => void;
  onCheckout?: () => void;
}

function formatInr(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export default function OrderSummary({ itemCount, subtotal, onApplyDiscount, onCheckout }: OrderSummaryProps) {
  const [code, setCode] = useState("");

  const handleApply = () => {
    if (!code.trim()) return;
    onApplyDiscount?.(code.trim());
  };

  return (
    <aside className="flex flex-col gap-6 rounded-2xl border border-white/10 bg-panel p-6">
      <h2 className="m-0 font-heading text-xl font-bold text-paper uppercase">Order Summary</h2>

      <div className="flex flex-col gap-3 font-sans text-sm">
        <div className="flex items-center justify-between text-paper">
          <span>
            Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})
          </span>
          <span>{formatInr(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-paper/50">
          <span>Shipping</span>
          <span>Calculated at checkout</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="discount-code" className="font-sans text-xs tracking-[0.04em] text-paper/50 uppercase">
          Discount Code
        </label>
        <div className="flex gap-2">
          <input
            id="discount-code"
            type="text"
            placeholder="Enter code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            className="h-11 flex-1 rounded-lg border border-white/20 bg-transparent px-3 font-sans text-sm text-paper placeholder:text-paper/40 focus:border-white/50 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleApply}
            className="h-11 shrink-0 cursor-pointer rounded-lg border border-white/30 bg-transparent px-5 font-heading text-xs font-bold tracking-[0.04em] text-paper uppercase transition-colors duration-200 hover:bg-paper hover:text-ink"
          >
            Apply
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-white/10 pt-5">
        <span className="font-heading text-base font-bold text-paper">Total</span>
        <span className="font-heading text-xl font-bold text-paper">{formatInr(subtotal)}</span>
      </div>

      <button
        type="button"
        onClick={onCheckout}
        className="flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border-0 bg-red font-heading text-sm font-bold tracking-[0.04em] text-paper uppercase transition-opacity duration-200 hover:opacity-90"
      >
        Proceed to Checkout <span aria-hidden="true">→</span>
      </button>

      <div className="flex flex-col items-center gap-1.5 font-sans text-[11px] text-paper/40 sm:flex-row sm:justify-between">
        <span>Secure checkout</span>
        <span>Free shipping above {formatInr(FREE_SHIPPING_THRESHOLD)}</span>
        <span>Easy returns</span>
      </div>
    </aside>
  );
}
