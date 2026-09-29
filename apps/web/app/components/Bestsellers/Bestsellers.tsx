"use client";

import PoppedCard, { type PoppedCardColor } from "../PoppedCard/PoppedCard";

export interface BestsellerProduct {
  slug: string;
  title: string;
  subtitle?: string;
  badge?: string;
  /** Finished card visual — the product's `cardImage`, not its gallery images. */
  imageSrc: string;
  price: number;
  mrp?: number;
  colors?: PoppedCardColor[];
}

export interface BestsellersProps {
  title?: string;
  products: BestsellerProduct[];
  /**
   * "carousel" (default) is the homepage's single row; "grid" wraps every
   * product into rows of four for longer lists (About Us).
   */
  layout?: "carousel" | "grid";
}

function formatInr(amount: number) {
  return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * "Bestsellers" section: centred heading over product cards.
 * Carousel: four-up grid from lg; below that it becomes a snap-scrolling strip
 * so the cards keep a usable width instead of squeezing into columns.
 * Grid: 1 → 2 → 4 columns, wrapping into as many rows as there are products.
 */
export default function Bestsellers({ title = "Bestsellers", products, layout = "carousel" }: BestsellersProps) {
  return (
    <section className="w-full bg-ink px-4 py-16 text-paper sm:px-6 lg:px-8 lg:py-20">
      <h2 className="m-0 text-center font-heading text-[clamp(32px,4.2vw,64px)] font-bold leading-none">{title}</h2>

      <div
        className={
          layout === "grid"
            ? "mx-auto mt-6 grid max-w-7xl grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:mt-10 lg:grid-cols-4 lg:gap-y-14"
            : "mt-6 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 lg:mt-10 lg:grid lg:grid-cols-4 lg:gap-6 lg:overflow-visible"
        }
      >
        {products.map((product) => (
          <div
            key={product.slug}
            className={layout === "grid" ? undefined : "w-[78vw] shrink-0 snap-start sm:w-80 lg:w-auto"}
          >
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
    </section>
  );
}
