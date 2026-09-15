"use client";

import AccordionItem from "../Accordion/AccordionItem";
import type { ProductAccordionEntry } from "../../lib/dummyProduct";

export interface ProductInfoProps {
  name: string;
  description: string;
  price: number;
  mrp: number;
  sizes: string[];
  activeSize: string;
  onSizeChange: (size: string) => void;
  accordion: ProductAccordionEntry[];
  onAddToBag: () => void;
}

function formatInr(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export default function ProductInfo({
  name,
  description,
  price,
  mrp,
  sizes,
  activeSize,
  onSizeChange,
  accordion,
  onAddToBag,
}: ProductInfoProps) {
  const discountPct = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <h1 className="m-0 font-heading text-3xl font-bold text-paper">{name}</h1>

        <div className="flex flex-wrap items-center gap-3">
          <span className="font-heading text-2xl font-bold text-gold">{formatInr(price)}/PAIR</span>
          {mrp > price && (
            <span className="font-sans text-sm text-paper/40 line-through">MRP: {formatInr(mrp)}</span>
          )}
          {discountPct > 0 && (
            <span className="rounded-full bg-red/15 px-3 py-1 font-sans text-xs font-semibold text-red">
              {discountPct}% OFF
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <span className="font-heading text-xs font-bold tracking-[0.08em] text-paper/50 uppercase">
          Product Description
        </span>
        <p className="m-0 max-w-[62ch] font-sans text-sm leading-relaxed text-paper/60">{description}</p>
      </div>

      <div className="flex flex-col gap-3">
        <span className="font-heading text-xs font-bold tracking-[0.08em] text-paper/50 uppercase">Size</span>
        <div className="flex flex-wrap gap-2.5">
          {sizes.map((size) => (
            <button
              key={size}
              type="button"
              aria-pressed={size === activeSize}
              onClick={() => onSizeChange(size)}
              className={`h-11 min-w-11 cursor-pointer rounded-lg border px-3 font-heading text-sm font-semibold transition-colors duration-200 ${
                size === activeSize
                  ? "border-paper bg-paper text-ink"
                  : "border-white/20 bg-transparent text-paper hover:border-white/50"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={onAddToBag}
          className="flex h-14 w-full cursor-pointer items-center justify-center rounded-lg border border-paper bg-paper font-heading text-sm font-bold tracking-[0.04em] text-ink uppercase transition-colors duration-200 hover:bg-transparent hover:text-paper"
        >
          Add to Bag
        </button>

        <div className="flex items-start gap-3 py-1">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" className="mt-0.5 shrink-0 text-paper/50">
            <path
              d="M3 7h11v9H3zM14 10h4l3 3v3h-7zM6.5 19a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6zM17.5 19a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
          </svg>
          <p className="m-0 font-sans text-xs leading-relaxed text-paper/50">
            Free delivery on orders over ₹999. Enter your pincode at checkout to see estimated delivery dates.
          </p>
        </div>
      </div>

      <div>
        {accordion.map((entry) => (
          <AccordionItem key={entry.title} title={entry.title}>
            {entry.content}
          </AccordionItem>
        ))}
      </div>
    </div>
  );
}
