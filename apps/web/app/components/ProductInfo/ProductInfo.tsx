"use client";

import { useEffect, useState } from "react";
import AccordionItem from "../Accordion/AccordionItem";
import SizeGuideModal from "../SizeGuideModal/SizeGuideModal";
import type { ProductAccordionEntry, ProductColorOption, SizeGuide } from "../../lib/dummyProduct";

export interface ProductInfoProps {
  name: string;
  description: string;
  price: number;
  mrp: number;
  /** Shown under the title on mobile; hidden when there are no reviews yet. */
  rating: { average: number; count: number };
  /** On mobile the colour picker lives here; on desktop it's overlaid on the gallery. */
  colors: ProductColorOption[];
  activeColorSlug: string;
  onColorChange: (colorSlug: string) => void;
  sizes: string[];
  activeSize: string;
  onSizeChange: (size: string) => void;
  accordion: ProductAccordionEntry[];
  sizeGuide: SizeGuide;
  /** Sizes this product/color actually offers — the size guide modal disables every other chart row. */
  availableSizes: string[];
  onAddToBag: (quantity: number) => void;
}

const PINCODE_STORAGE_KEY = "gokaido:pincode";
/** Placeholder delivery promise — there's no serviceability/ETA API yet (see DUMMY_DATA.md). */
const DUMMY_DELIVERY_DAYS = 4;
/** Descriptions longer than this get clamped behind "Read More" on mobile. */
const DESCRIPTION_CLAMP_CHARS = 180;

function formatInr(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

function ordinal(day: number) {
  if (day % 100 >= 11 && day % 100 <= 13) return `${day}th`;
  return `${day}${["th", "st", "nd", "rd"][day % 10] ?? "th"}`;
}

function deliveryDateLabel() {
  const date = new Date();
  date.setDate(date.getDate() + DUMMY_DELIVERY_DAYS);
  return `${ordinal(date.getDate())} ${date.toLocaleDateString("en-IN", { month: "long" })}`;
}

const sectionLabelClass =
  "font-heading text-xs font-bold tracking-[0.08em] text-paper/50 uppercase max-lg:text-[15px] max-lg:font-semibold max-lg:tracking-[0.12em] max-lg:text-paper/80";

export default function ProductInfo({
  name,
  description,
  price,
  mrp,
  rating,
  colors,
  activeColorSlug,
  onColorChange,
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
  const [quantity, setQuantity] = useState(1);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [pincode, setPincode] = useState("");
  const [checkedPincode, setCheckedPincode] = useState<string | null>(null);
  const discountPct = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const activeColor = colors.find((color) => color.slug === activeColorSlug) ?? colors[0];
  const clampDescription = description.length > DESCRIPTION_CLAMP_CHARS;

  // Remember the shopper's pincode across product pages.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PINCODE_STORAGE_KEY);
      if (saved) {
        setPincode(saved);
        setCheckedPincode(saved);
      }
    } catch {
      // localStorage unavailable — shopper just re-enters it
    }
  }, []);

  const handleSizeSelect = (size: string) => {
    onSizeChange(size);
    setSizePickerOpen(false);
  };

  const handleSizeGuideSelect = (size: string) => {
    onSizeChange(size);
    setSizeGuideOpen(false);
  };

  const handlePincodeSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (checkedPincode !== null) {
      // "Change" — reopen the field for editing.
      setCheckedPincode(null);
      return;
    }
    if (!/^\d{6}$/.test(pincode)) return;
    setCheckedPincode(pincode);
    try {
      localStorage.setItem(PINCODE_STORAGE_KEY, pincode);
    } catch {
      // localStorage unavailable — fine, it just won't be remembered
    }
  };

  // Below `lg` the two column wrappers are `display: contents`, so every block below is a direct
  // flex item of the outer column and `order-*` lays them out in the mobile design's sequence.
  // From `lg` up the columns are real again and `lg:order-0` restores source order inside each.
  return (
    <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[689px_448px] lg:justify-between lg:gap-10">
      <div className="contents lg:flex lg:flex-col lg:gap-8">
        <div className="order-1 flex flex-col gap-4 max-lg:gap-3 lg:order-0">
          <div className="flex flex-col gap-1">
            <h1 className="m-0 font-heading text-3xl font-normal text-paper max-lg:text-[22px] max-lg:font-semibold">
              {name}
            </h1>
            {rating.count > 0 && (
              <div className="flex items-baseline gap-4 font-heading lg:hidden">
                <span className="text-base font-bold text-paper">{rating.average.toFixed(1)}</span>
                <span className="text-sm text-paper/50">
                  {rating.count.toLocaleString("en-IN")} Rating{rating.count === 1 ? "" : "s"}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 max-lg:mt-2">
            <span className="font-heading text-xl font-bold text-paper max-lg:text-2xl">
              {formatInr(price)}
              <span className="max-lg:hidden">/PAIR</span>
            </span>
            {mrp > price && (
              <span className="font-sans text-sm text-paper/40 line-through max-lg:font-heading max-lg:text-base">
                <span className="max-lg:hidden">MRP: {mrp.toLocaleString("en-IN")}</span>
                <span className="lg:hidden">{formatInr(mrp)}</span>
              </span>
            )}
            {discountPct > 0 && (
              <span className="rounded-md bg-white/10 px-2 py-1 font-sans text-xs font-semibold text-paper/70 max-lg:bg-white/15 max-lg:px-2.5 max-lg:font-heading max-lg:text-sm max-lg:font-bold max-lg:text-paper">
                {discountPct}% OFF
              </span>
            )}
          </div>
        </div>

        {/* Mobile-only colour picker — desktop has it overlaid on the gallery. */}
        {colors.length > 0 && (
          <div className="order-2 flex flex-col gap-2 border-y border-white/30 py-3 lg:hidden">
            <div className="flex items-center gap-3">
              {colors.map((color) => (
                <button
                  key={color.slug}
                  type="button"
                  aria-label={color.name}
                  aria-pressed={color.slug === activeColorSlug}
                  onClick={() => onColorChange(color.slug)}
                  className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-transparent p-0 ${
                    color.slug === activeColorSlug ? "border-2 border-paper" : "border-0"
                  }`}
                >
                  <span
                    className="block h-6.5 w-6.5 rounded-full border border-white/25"
                    style={{ backgroundColor: color.hex }}
                  />
                </button>
              ))}
            </div>
            <span className="font-heading text-sm font-semibold text-paper">{activeColor?.name}</span>
          </div>
        )}

        <div className="order-7 flex flex-col gap-3 max-lg:border-t max-lg:border-white/30 max-lg:pt-5 lg:order-0">
          <span className={sectionLabelClass}>Product Description</span>
          <p
            className={`m-0 max-w-[62ch] font-sans text-sm leading-relaxed text-paper/60 max-lg:text-[15px] ${
              clampDescription && !descriptionExpanded ? "max-lg:line-clamp-4" : ""
            }`}
          >
            {description}
          </p>
          {clampDescription && (
            <button
              type="button"
              onClick={() => setDescriptionExpanded((value) => !value)}
              aria-expanded={descriptionExpanded}
              className="flex cursor-pointer items-center gap-3 self-start border-0 bg-transparent p-0 font-sans text-[15px] text-paper/80 lg:hidden"
            >
              <span aria-hidden="true" className="text-lg leading-none">
                {descriptionExpanded ? "−" : "+"}
              </span>
              {descriptionExpanded ? "Read Less" : "Read More"}
            </button>
          )}
        </div>

        <div className="order-8 border-t border-white/10 max-lg:-mt-2 max-lg:border-white/30 lg:order-0">
          {accordion.map((entry) => (
            <AccordionItem key={entry.title} title={entry.title} uppercaseTitle>
              {entry.content}
            </AccordionItem>
          ))}
        </div>
      </div>

      <div className="contents lg:flex lg:flex-col lg:gap-4">
        <div className="order-4 flex gap-3 lg:order-0">
          <div className="flex h-10 w-23 shrink-0 items-center justify-between rounded-md border border-paper px-1 font-sans text-paper lg:hidden">
            <button
              type="button"
              aria-label="Decrease quantity"
              disabled={quantity <= 1}
              onClick={() => setQuantity((value) => Math.max(1, value - 1))}
              className="h-full w-7 cursor-pointer border-0 bg-transparent p-0 text-lg text-paper disabled:opacity-40"
            >
              -
            </button>
            <span aria-live="polite" className="text-base">
              {quantity}
            </span>
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() => setQuantity((value) => value + 1)}
              className="h-full w-7 cursor-pointer border-0 bg-transparent p-0 text-lg text-paper"
            >
              +
            </button>
          </div>

          <button
            type="button"
            // The quantity stepper is mobile-only, so desktop always adds one.
            onClick={() => onAddToBag(window.matchMedia("(min-width: 1024px)").matches ? 1 : quantity)}
            className="flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-red bg-red font-heading text-sm font-bold tracking-[0.04em] text-paper uppercase transition-colors duration-200 hover:bg-transparent hover:text-red max-lg:h-10 max-lg:rounded-none max-lg:text-xs max-lg:font-semibold max-lg:tracking-[0.16em]"
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
        </div>

        <div className="order-5 lg:order-0">
          <div className="hidden items-start gap-3 lg:flex">
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

          <form onSubmit={handlePincodeSubmit} className="flex flex-col gap-3 pb-4 lg:hidden">
            <label htmlFor="pdp-pincode" className="sr-only">
              Delivery pincode
            </label>
            <div className="flex h-10 overflow-hidden rounded-md border border-white/40 bg-paper">
              <input
                id="pdp-pincode"
                type="text"
                inputMode="numeric"
                autoComplete="postal-code"
                maxLength={6}
                placeholder="Enter pincode"
                value={pincode}
                readOnly={checkedPincode !== null}
                onChange={(event) => setPincode(event.target.value.replace(/\D/g, ""))}
                className="min-w-0 flex-1 border-0 bg-transparent px-4 font-sans text-base text-ink outline-none placeholder:text-ink/40"
              />
              <button
                type="submit"
                className="w-35 shrink-0 cursor-pointer border-0 border-l border-ink bg-transparent font-heading text-base font-semibold text-ink"
              >
                {checkedPincode !== null ? "Change" : "Check"}
              </button>
            </div>
            {checkedPincode !== null && (
              <p className="m-0 flex items-center gap-2 font-sans text-sm text-paper">
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" className="shrink-0 text-paper/70">
                  <path
                    d="M2 6h11v10H2zM13 9h4l3 3.5V16h-7M5.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM16.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinejoin="round"
                  />
                </svg>
                Express Delivery By {deliveryDateLabel()}
              </p>
            )}
          </form>
        </div>

        <div className="order-3 flex flex-col gap-3 border-t border-white/10 pt-4 max-lg:border-0 max-lg:pt-0 lg:order-0">
          <div className="flex items-center justify-between">
            <span className={sectionLabelClass}>Select Size</span>
            <button
              type="button"
              onClick={() => setSizeGuideOpen(true)}
              className="cursor-pointer border-0 bg-transparent p-0 font-sans text-xs text-paper/60 underline hover:text-paper max-lg:text-sm"
            >
              Size Guide
            </button>
          </div>

          <button
            type="button"
            onClick={() => setSizePickerOpen((open) => !open)}
            aria-expanded={sizePickerOpen}
            className="flex h-13 w-full cursor-pointer items-center justify-between rounded-lg border border-white/20 bg-transparent px-4 font-sans text-sm text-paper transition-colors duration-200 hover:border-white/40 max-lg:h-11.5 max-lg:rounded-md max-lg:border-white/30 max-lg:text-base"
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
