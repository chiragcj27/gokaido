"use client";

import { useMemo, useState } from "react";
import PoppedCard from "../PoppedCard/PoppedCard";
import type { KitAddOn } from "../../lib/dummyProduct";

export interface BuildYourKitProps {
  items: KitAddOn[];
}

function formatInr(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export default function BuildYourKit({ items }: BuildYourKitProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const total = useMemo(
    () => items.filter((item) => selected.has(item.key)).reduce((sum, item) => sum + item.price, 0),
    [items, selected],
  );

  const toggleItem = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <section className="flex flex-col gap-10">
      <div className="flex flex-col items-center gap-2 text-center">
        <h2 className="m-0 font-heading text-2xl font-bold text-paper">Build Your Kit</h2>
        <p className="m-0 max-w-[60ch] font-sans text-sm leading-relaxed text-paper/55">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
          dolore magna aliqua.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div key={item.key} className="relative">
            <PoppedCard
              variant="product"
              imageSrc={item.imageSrc}
              imageAlt={item.title}
              title={item.title}
              subtitle={item.subtitle}
              price={formatInr(item.price)}
              originalPrice={item.mrp > item.price ? formatInr(item.mrp) : undefined}
              colors={item.colors}
              onAddToCart={() => toggleItem(item.key)}
            />
            {selected.has(item.key) && (
              <span className="absolute top-4 left-4 z-30 rounded-full bg-gold px-3 py-1 font-heading text-[11px] font-bold text-ink uppercase">
                Added
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-white/10 bg-panel px-6 py-5 sm:flex-row">
        <div className="flex flex-col gap-1">
          <span className="font-heading text-sm font-semibold text-paper">
            Your Custom Routine ({selected.size} {selected.size === 1 ? "Item" : "Items"})
          </span>
          <span className="font-sans text-xs text-paper/50">
            Total <span className="font-heading font-bold text-gold">{formatInr(total)}</span>
          </span>
        </div>
        <div className="flex w-full gap-3 sm:w-auto">
          <button
            type="button"
            disabled={selected.size === 0}
            className="h-13 flex-1 cursor-pointer rounded-lg border border-white/30 bg-transparent px-6 font-heading text-xs font-bold tracking-[0.04em] text-paper uppercase transition-colors duration-200 hover:bg-paper hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-paper sm:w-40"
          >
            Add To Cart
          </button>
          <button
            type="button"
            disabled={selected.size === 0}
            className="h-13 flex-1 cursor-pointer rounded-lg border border-red bg-red px-6 font-heading text-xs font-bold tracking-[0.04em] text-paper uppercase transition-colors duration-200 hover:bg-transparent hover:text-red disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-red disabled:hover:text-paper sm:w-40"
          >
            Buy Now
          </button>
        </div>
      </div>
    </section>
  );
}
