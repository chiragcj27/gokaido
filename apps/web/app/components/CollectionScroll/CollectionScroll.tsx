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
    <section
      data-collection-slide
      className="flex min-h-full w-full flex-col gap-10 px-6 pt-16 md:grid md:grid-cols-[594fr_896fr] md:items-start md:gap-12 md:pt-0 lg:px-10"
    >
      {/* Pinned to the top of the scroll pane while this section's grid scrolls past;
          releases with the section once its last product is reached. */}
      <div className="md:sticky md:top-0 md:flex md:h-[var(--pane-h)] md:items-center">
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
      </div>

      <div
        className={`grid grid-cols-2 gap-x-5 gap-y-10 pb-16 transition-all delay-100 duration-700 ease-out sm:grid-cols-3 md:py-16 ${
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

    const slides = () => Array.from(container.querySelectorAll<HTMLElement>("[data-collection-slide]"));

    const update = () => {
      container.style.setProperty("--pane-h", `${container.clientHeight}px`);
      const els = slides();
      if (!els.length) return;
      // Sections have varying heights, so progress is measured against each section's
      // own top edge rather than a fixed slide height.
      const tops = els.map((el) => el.offsetTop);
      const y = container.scrollTop;
      let i = tops.length - 1;
      while (i > 0 && tops[i] > y) i--;
      const next = tops[i + 1];
      // The pinned card only changes while the section is scrolling away, i.e. over the
      // final pane-height before the next section's top.
      const pane = container.clientHeight;
      const fraction = next === undefined ? 0 : Math.min(Math.max((y - (next - pane)) / pane, 0), 1);
      setProgress(Math.min(Math.max(i + fraction, 0), els.length - 1));
    };

    let raf = 0;
    const handleScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    update();
    container.addEventListener("scroll", handleScroll, { passive: true });
    const observer = new ResizeObserver(handleScroll);
    observer.observe(container);
    slides().forEach((el) => observer.observe(el));
    return () => {
      container.removeEventListener("scroll", handleScroll);
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [subcategories.length]);

  const activeIndex = Math.round(progress);

  const scrollToIndex = (index: number) => {
    const container = containerRef.current;
    const target = container?.querySelectorAll<HTMLElement>("[data-collection-slide]")[index];
    if (!container || !target) return;
    container.scrollTo({ top: target.offsetTop, behavior: "smooth" });
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
        className="relative flex-1 overflow-y-auto overflow-x-hidden scroll-smooth"
      >
        {subcategories.map((subcategory, index) => (
          <CollectionSlide key={subcategory.key} subcategory={subcategory} isActive={index === activeIndex} />
        ))}
      </div>
    </div>
  );
}
