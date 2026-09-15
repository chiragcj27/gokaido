"use client";

import { useRef } from "react";
import PoppedCard from "../PoppedCard/PoppedCard";
import type { RelatedProduct } from "../../lib/dummyProduct";

export interface RelatedProductsProps {
  title?: string;
  products: RelatedProduct[];
}

function formatInr(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export default function RelatedProducts({ title = "You Might Also Like", products }: RelatedProductsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollBy = (direction: 1 | -1) => {
    scrollRef.current?.scrollBy({ left: direction * 360, behavior: "smooth" });
  };

  return (
    <section className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-4">
        <h2 className="m-0 font-heading text-2xl font-bold text-paper">{title}</h2>
        <div className="flex items-center gap-4">
          <a href="/collections" className="font-sans text-sm text-paper/60 hover:text-paper">
            Shop All
          </a>
          <div className="hidden gap-2 sm:flex">
            <button
              type="button"
              aria-label="Previous"
              onClick={() => scrollBy(-1)}
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-transparent text-paper transition-colors duration-200 hover:border-white/50"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Next"
              onClick={() => scrollBy(1)}
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-transparent text-paper transition-colors duration-200 hover:border-white/50"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-2">
        {products.map((product) => (
          <div key={product.key} className="w-72 shrink-0 snap-start sm:w-80">
            <PoppedCard
              variant="product"
              imageSrc={product.imageSrc}
              imageAlt={product.title}
              title={product.title}
              subtitle={product.subtitle}
              price={formatInr(product.price)}
              originalPrice={product.mrp > 0 ? formatInr(product.mrp) : undefined}
              colors={product.colors}
              href={`/products/${product.slug}`}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
