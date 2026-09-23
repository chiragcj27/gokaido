"use client";

import PoppedCard, { type PoppedCardColor } from "../PoppedCard/PoppedCard";

export interface BestsellerProduct {
  slug: string;
  title: string;
  subtitle?: string;
  /** Finished card visual — the product's `cardImage`, not its gallery images. */
  imageSrc: string;
  price: number;
  mrp?: number;
  colors?: PoppedCardColor[];
}

export interface BestsellersProps {
  title?: string;
  products: BestsellerProduct[];
}

function formatInr(amount: number) {
  return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Homepage "Bestsellers" row: centred heading over four product cards.
 * Four-up grid from lg; below that it becomes a snap-scrolling strip so the
 * cards keep a usable width instead of squeezing into columns.
 */
export default function Bestsellers({ title = "Bestsellers", products }: BestsellersProps) {
  return (
    <section className="w-full bg-ink px-4 py-16 text-paper sm:px-6 lg:px-8 lg:py-20">
      <h2 className="m-0 text-center font-heading text-[clamp(32px,4.2vw,64px)] font-bold leading-none">{title}</h2>

      <div className="mt-6 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 lg:mt-10 lg:grid lg:grid-cols-4 lg:gap-6 lg:overflow-visible">
        {products.map((product) => (
          <div key={product.slug} className="w-[78vw] shrink-0 snap-start sm:w-80 lg:w-auto">
            <PoppedCard
              variant="product"
              imageSrc={product.imageSrc}
              imageAlt={product.title}
              title={product.title}
              subtitle={product.subtitle}
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
