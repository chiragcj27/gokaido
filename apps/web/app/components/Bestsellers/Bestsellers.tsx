"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import PoppedCard, { type PoppedCardColor } from "../PoppedCard/PoppedCard";

export interface BestsellerProduct {
  slug: string;
  title: string;
  subtitle?: string;
  badge?: string;
  /** The product's `cardImage` (its card/thumbnail photo), not its gallery images. */
  imageSrc: string;
  price: number;
  mrp?: number;
  colors?: PoppedCardColor[];
}

export interface BestsellersProps {
  title?: string;
  /** Optional line under the heading (e.g. a search result count or empty-state message). */
  subtitle?: string;
  /** Rendered under the cards inside the section (e.g. pagination on search results). */
  footer?: ReactNode;
  products: BestsellerProduct[];
  /**
   * "carousel" (default) is the homepage's single row; "grid" wraps every
   * product into rows of four for longer lists (About Us).
   */
  layout?: "carousel" | "grid";
  /**
   * Phones only: replaces the centred heading with a left-aligned `mobileTitle`
   * and a "Shop All" link to this href on the right.
   */
  shopAllHref?: string;
  mobileTitle?: string;
}

function formatInr(amount: number) {
  return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * "Bestsellers" section: centred heading over product cards.
 * Carousel: four-up from lg, a 2-column grid from md, and on phones a
 * horizontally scrolling row with the next card peeking in.
 * Grid: 2 columns (2×2 on mobile) → 4 from lg, wrapping into as many rows as there are products.
 */
export default function Bestsellers({
  title = "Bestsellers",
  subtitle,
  footer,
  products,
  layout = "carousel",
  shopAllHref,
  mobileTitle = title,
}: BestsellersProps) {
  const mobileHeader = Boolean(shopAllHref);
  return (
    <section className="w-full bg-ink px-4 py-16 text-paper sm:px-6 lg:px-8 lg:py-20">
      {mobileHeader && (
        <div className="flex items-center justify-between gap-4 md:hidden">
          <h2 className="m-0 font-heading text-[22px] font-semibold leading-none">{mobileTitle}</h2>
          <Link href={shopAllHref!} className="shrink-0 font-sans text-[15px] font-medium text-paper underline underline-offset-4">
            Shop All
          </Link>
        </div>
      )}
      <h2
        className={`m-0 text-center font-heading text-[clamp(32px,4.2vw,64px)] font-bold leading-none ${
          mobileHeader ? "max-md:hidden" : ""
        }`}
      >
        {title}
      </h2>
      {subtitle && <p className="m-0 mt-4 text-center font-sans text-base text-paper/60">{subtitle}</p>}

      <div
        className={
          layout === "grid"
            ? "mx-auto mt-6 grid max-w-7xl grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-6 sm:gap-y-10 lg:mt-10 lg:grid-cols-4 lg:gap-y-14"
            : // Phones: a swipeable row bleeding to the screen edges (-mx-4/px-4
              // undo the section padding) with snap so a card lands aligned.
              "-mx-4 mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 md:mx-0 md:grid md:grid-cols-2 md:gap-5 md:overflow-visible md:px-0 lg:mt-10 lg:grid-cols-4 lg:gap-6"
        }
      >
        {products.map((product) => (
          <div key={product.slug} className={layout === "grid" ? undefined : "w-[70vw] shrink-0 snap-start md:w-auto"}>
            <PoppedCard
              variant="product"
              imageSrc={product.imageSrc}
              imageAlt={product.title}
              title={product.title}
              subtitle={product.subtitle}
              badge={product.badge}
              price={formatInr(product.price)}
              originalPrice={product.mrp ? formatInr(product.mrp) : undefined}
              colors={product.colors}
              href={`/products/${product.slug}`}
              // Placeholder like the other listing rows — a real add needs a
              // size pick, which a card doesn't offer yet.
              onAddToCart={() => console.log(`Added ${product.title} to cart`)}
            />
          </div>
        ))}
      </div>
      {footer && <div className="mt-12 lg:mt-16">{footer}</div>}
    </section>
  );
}
