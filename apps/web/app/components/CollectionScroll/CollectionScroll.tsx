"use client";

import { useEffect, useRef, useState } from "react";
import PoppedCard, { type PoppedCardColor } from "../PoppedCard/PoppedCard";
import CollectionCategoryBar from "../CollectionCategoryBar/CollectionCategoryBar";

export interface CollectionProduct {
  key: string;
  imageSrc: string;
  title: string;
  subtitle?: string;
  price?: string;
  originalPrice?: string;
  colors?: PoppedCardColor[];
  href?: string;
}

export interface CollectionSubcategory {
  key: string;
  imageSrc: string;
  eyebrow?: string;
  title: string;
  description?: string;
  href?: string;
  products: CollectionProduct[];
}

interface CollectionSlideProps {
  subcategory: CollectionSubcategory;
  isActive: boolean;
}

function CollectionSlide({ subcategory, isActive }: CollectionSlideProps) {
  return (
    <section className="flex min-h-full w-full shrink-0 snap-start flex-col gap-10 px-6 py-16 md:grid md:grid-cols-[594fr_896fr] md:items-center md:gap-12 lg:px-10">
      <div
        className={`w-full shrink-0 transition-all duration-700 ease-out ${
          isActive ? "translate-y-0 opacity-100" : "translate-y-14 opacity-0"
        }`}
      >
        <PoppedCard
          variant="subcategory"
          imageSrc={subcategory.imageSrc}
          imageAlt={subcategory.title}
          eyebrow={subcategory.eyebrow}
          title={subcategory.title}
          description={subcategory.description}
          href={subcategory.href}
        />
      </div>

      <div
        className={`grid grid-cols-2 gap-x-5 gap-y-10 transition-all delay-100 duration-700 ease-out sm:grid-cols-3 ${
          isActive ? "translate-y-0 opacity-100" : "translate-y-14 opacity-0"
        }`}
      >
        {subcategory.products.map((product) => (
          <PoppedCard
            key={product.key}
            variant="product"
            imageSrc={product.imageSrc}
            imageAlt={product.title}
            title={product.title}
            subtitle={product.subtitle}
            price={product.price}
            originalPrice={product.originalPrice}
            colors={product.colors}
            href={product.href}
            onAddToCart={() => console.log(`Added ${product.title} to cart`)}
          />
        ))}
      </div>
    </section>
  );
}

export default function CollectionScroll({
  categoryName,
  subcategories,
}: {
  categoryName: string;
  subcategories: CollectionSubcategory[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let raf = 0;
    const handleScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const slideHeight = container.clientHeight;
        if (!slideHeight) return;
        const maxIndex = subcategories.length - 1;
        const raw = container.scrollTop / slideHeight;
        setProgress(Math.min(Math.max(raw, 0), maxIndex));
      });
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(raf);
    };
  }, [subcategories.length]);

  const activeIndex = Math.round(progress);

  const scrollToIndex = (index: number) => {
    const container = containerRef.current;
    if (!container) return;
    container.scrollTo({ top: index * container.clientHeight, behavior: "smooth" });
  };

  return (
    <div className="flex h-dvh flex-col">
      <CollectionCategoryBar
        categoryName={categoryName}
        steps={subcategories.map((subcategory) => ({
          key: subcategory.key,
          title: subcategory.title,
          imageSrc: subcategory.imageSrc,
        }))}
        progress={progress}
        activeIndex={activeIndex}
        onStepClick={scrollToIndex}
      />

      <div
        ref={containerRef}
        className="flex-1 snap-y snap-mandatory overflow-y-auto overflow-x-hidden scroll-smooth"
      >
        {subcategories.map((subcategory, index) => (
          <CollectionSlide key={subcategory.key} subcategory={subcategory} isActive={index === activeIndex} />
        ))}
      </div>
    </div>
  );
}
