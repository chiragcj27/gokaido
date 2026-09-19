"use client";

import { useState } from "react";
import AccordionItem from "../Accordion/AccordionItem";
import SizeGuideModal from "../SizeGuideModal/SizeGuideModal";
import type { ProductAccordionEntry, SizeGuide } from "../../lib/dummyProduct";

export interface ProductInfoProps {
  name: string;
  description: string;
  price: number;
  mrp: number;
  sizes: string[];
  activeSize: string;
  onSizeChange: (size: string) => void;
  accordion: ProductAccordionEntry[];
  sizeGuide: SizeGuide;
  /** Sizes this product/color actually offers — the size guide modal disables every other chart row. */
  availableSizes: string[];
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
  sizeGuide,
  availableSizes,
  onAddToBag,
}: ProductInfoProps) {
  const [sizePickerOpen, setSizePickerOpen] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const discountPct = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

  const handleSizeSelect = (size: string) => {
    onSizeChange(size);
    setSizePickerOpen(false);
  };

  const handleSizeGuideSelect = (size: string) => {
    onSizeChange(size);
    setSizeGuideOpen(false);
  };

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[689px_448px] lg:justify-between lg:gap-10">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <h1 className="m-0 font-heading text-3xl font-normal text-paper">{name}</h1>

          <div className="flex flex-wrap items-center gap-3">
            <span className="font-heading text-xl font-bold text-paper">{formatInr(price)}/PAIR</span>
            {mrp > price && (
              <span className="font-sans text-sm text-paper/40 line-through">MRP: {mrp.toLocaleString("en-IN")}</span>
            )}
            {discountPct > 0 && (
              <span className="rounded-md bg-white/10 px-2 py-1 font-sans text-xs font-semibold text-paper/70">
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

        <div className="border-t border-white/10">
          {accordion.map((entry) => (
            <AccordionItem key={entry.title} title={entry.title} uppercaseTitle>
              {entry.content}
            </AccordionItem>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={onAddToBag}
          className="flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-red bg-red font-heading text-sm font-bold tracking-[0.04em] text-paper uppercase transition-colors duration-200 hover:bg-transparent hover:text-red"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path
              d="M6 8h12l-1 12.5a1.5 1.5 0 0 1-1.5 1.5h-7a1.5 1.5 0 0 1-1.5-1.5zM9 8V6a3 3 0 0 1 6 0v2"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
          Add to Bag
        </button>

        <div className="flex items-start gap-3">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" className="mt-0.5 shrink-0 text-paper/50">
            <path
              d="M7 7h13M7 7l3-3M7 7l3 3M17 17H4M17 17l-3-3M17 17l-3 3"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="m-0 font-sans text-xs leading-relaxed text-paper/50">
            Estimated time for complimentary Express delivery or Collect in Store: Tue, 1 Sept - Wed, 2 Sept
          </p>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 pt-4">
          <div className="flex items-center justify-between">
            <span className="font-heading text-xs font-bold tracking-[0.08em] text-paper/50 uppercase">
              Select Size
            </span>
            <button
              type="button"
              onClick={() => setSizeGuideOpen(true)}
              className="cursor-pointer border-0 bg-transparent p-0 font-sans text-xs text-paper/60 underline hover:text-paper"
            >
              Size Guide
            </button>
          </div>

          <button
            type="button"
            onClick={() => setSizePickerOpen((open) => !open)}
            aria-expanded={sizePickerOpen}
            className="flex h-13 w-full cursor-pointer items-center justify-between rounded-lg border border-white/20 bg-transparent px-4 font-sans text-sm text-paper transition-colors duration-200 hover:border-white/40"
          >
            {activeSize ? activeSize : "Choose Size"}
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              aria-hidden="true"
              className={`transition-transform duration-200 ${sizePickerOpen ? "rotate-180" : ""}`}
            >
              <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div
            className={`grid overflow-hidden transition-all duration-300 ease-out ${
              sizePickerOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="flex min-h-0 flex-wrap gap-2.5 overflow-hidden pt-1">
              {sizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  aria-pressed={size === activeSize}
                  onClick={() => handleSizeSelect(size)}
                  className={`h-11 min-w-11 cursor-pointer rounded-lg bg-paper px-3 font-heading text-sm font-semibold text-ink transition-shadow duration-200 ${
                    size === activeSize ? "ring-2 ring-red ring-offset-2 ring-offset-ink" : ""
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <SizeGuideModal
        open={sizeGuideOpen}
        onClose={() => setSizeGuideOpen(false)}
        sizeGuide={sizeGuide}
        availableSizes={availableSizes}
        activeSize={activeSize}
        onSizeSelect={handleSizeGuideSelect}
      />
    </div>
  );
}
