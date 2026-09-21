"use client";

import { useEffect, useRef, useState } from "react";
import PoppedCard, { type PoppedCardColor } from "../PoppedCard/PoppedCard";
import CollectionCategoryBar from "../CollectionCategoryBar/CollectionCategoryBar";
import Footer from "../Footer/Footer";

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
  /** Small preview shown on hover in the category bar; falls back to `imageSrc`. */
  iconSrc?: string;
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
        {/* The card's height follows its width (594:470 card image), so on short viewports (e.g. Windows at
            125-150% scaling) cap the width so the whole card always fits inside the pane. */}
        <div
          className={`w-full shrink-0 md:max-w-[max(18rem,calc((var(--pane-h)-14rem)*1.26))] transition-all duration-700 ease-out ${
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
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const slides = () => Array.from(container.querySelectorAll<HTMLElement>("[data-collection-slide]"));

    const update = () => {
      // Fit the page to what's left of the viewport below the navbar so the document itself never scrolls.
      const wrapper = wrapperRef.current;
      if (wrapper) wrapper.style.setProperty("--top", `${wrapper.getBoundingClientRect().top + window.scrollY}px`);
      container.style.setProperty("--pane-h", `${container.clientHeight}px`);
      const els = slides();
      if (!els.length) return;
      // Sections have varying heights, so progress is each section's own scroll extent:
      // from its top edge to the next section's top (the last one runs to the end of the pane's scroll).
      const tops = els.map((el) => el.offsetTop);
      const y = container.scrollTop;
      let i = tops.length - 1;
      while (i > 0 && tops[i] > y) i--;
      const end = i === tops.length - 1 ? container.scrollHeight - container.clientHeight : tops[i + 1];
      const span = end - tops[i];
      const fraction = span > 0 ? Math.min(Math.max((y - tops[i]) / span, 0), 1) : 0;
      // Each section owns one dot; the last one's scroll carries the line on to the bar's far end (+0.5).
      const last = i === els.length - 1;
      setProgress(i + fraction * (last ? 0.5 : 1));
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

  const activeIndex = Math.min(Math.floor(progress), subcategories.length - 1);

  const scrollToIndex = (index: number) => {
    const container = containerRef.current;
    const target = container?.querySelectorAll<HTMLElement>("[data-collection-slide]")[index];
    if (!container || !target) return;
    container.scrollTo({ top: target.offsetTop, behavior: "smooth" });
  };

  return (
    <div ref={wrapperRef} className="flex h-[calc(100dvh-var(--top,0px))] flex-col">
      <CollectionCategoryBar
        categoryName={categoryName}
        steps={subcategories.map((subcategory) => ({
          key: subcategory.key,
          title: subcategory.title,
          imageSrc: subcategory.iconSrc ?? subcategory.imageSrc,
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
        <Footer />
      </div>
    </div>
  );
}
