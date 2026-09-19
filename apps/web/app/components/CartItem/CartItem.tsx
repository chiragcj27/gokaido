"use client";

import Image from "next/image";
import Link from "next/link";
import type { CartItem as CartItemData } from "../../lib/cartStore";

export interface CartItemProps {
  item: CartItemData;
  onQuantityChange: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  onSaveForLater: (id: string) => void;
}

function formatInr(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export default function CartItem({ item, onQuantityChange, onRemove, onSaveForLater }: CartItemProps) {
  return (
    <div className="flex flex-col gap-5 border-b border-white/10 py-6 last:border-b-0 sm:flex-row sm:items-center">
      <div className="flex flex-1 items-start gap-4">
        <Link
          href={`/products/${item.productSlug}`}
          className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-[url('/card/card_bg.png')] bg-cover bg-center"
        >
          <Image
            src={item.imageSrc}
            alt={item.name}
            fill
            className="scale-125 object-contain p-2"
            sizes="96px"
          />
        </Link>

        <div className="flex min-w-0 flex-col gap-1.5">
          <Link
            href={`/products/${item.productSlug}`}
            className="font-heading text-base font-bold text-paper hover:underline"
          >
            {item.name}
          </Link>
          <p className="m-0 font-sans text-xs text-paper/50">{item.category}</p>
          <p className="m-0 font-sans text-xs text-paper/50">
            Size: {item.size} <span className="mx-1">|</span> Color: {item.color}
          </p>
          <button
            type="button"
            onClick={() => onSaveForLater(item.id)}
            className="mt-1 w-fit cursor-pointer border-0 bg-transparent p-0 font-heading text-[11px] font-bold tracking-[0.02em] text-red uppercase hover:underline"
          >
            Save for Later
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-6 sm:justify-end">
        <div className="flex items-center rounded-lg border border-white/20">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => onQuantityChange(item.id, Math.max(1, item.quantity - 1))}
            className="flex h-10 w-10 cursor-pointer items-center justify-center border-0 bg-transparent font-heading text-lg text-paper transition-colors duration-200 hover:text-gold"
          >
            −
          </button>
          <span className="w-8 text-center font-sans text-sm text-paper tabular-nums">
            {String(item.quantity).padStart(2, "0")}
          </span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => onQuantityChange(item.id, item.quantity + 1)}
            className="flex h-10 w-10 cursor-pointer items-center justify-center border-0 bg-transparent font-heading text-lg text-paper transition-colors duration-200 hover:text-gold"
          >
            +
          </button>
        </div>

        <span className="w-20 shrink-0 text-right font-heading text-base font-bold text-paper">
          {formatInr(item.price * item.quantity)}
        </span>

        <button
          type="button"
          aria-label="Remove item"
          onClick={() => onRemove(item.id)}
          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent text-paper/50 transition-colors duration-200 hover:text-red"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path
              d="M4 7h16M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7m2 0-.8 12.1a2 2 0 0 1-2 1.9H9.8a2 2 0 0 1-2-1.9L7 7h10Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
