"use client";

import { useRef, useState, type MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import Footer from "../Footer/Footer";
import type { CollectionProduct, CollectionSubcategory } from "../CollectionScroll/CollectionScroll";

const PAGE_SIZE = 6;

const parsePrice = (value?: string) => (value ? Number(value.replace(/[^\d.]/g, "")) : NaN);

/** "20% OFF" when the product carries a higher original price; nothing otherwise. */
function discountLabel(price?: string, originalPrice?: string) {
  const now = parsePrice(price);
  const was = parsePrice(originalPrice);
  if (!(now > 0) || !(was > now)) return null;
  return `${Math.round(((was - now) / was) * 100)}% OFF`;
}

function MobileProductCard({ product }: { product: CollectionProduct }) {
  const [liked, setLiked] = useState(false);
  const discount = discountLabel(product.price, product.originalPrice);

  const handleToggleWishlist = (event: MouseEvent) => {
    event.preventDefault();
    setLiked((value) => !value);
  };

  const card = (
    <article className="flex h-full flex-col">
      <div className="relative aspect-594/470 overflow-hidden bg-panel">
        <Image
          src={product.imageSrc}
          alt={product.title}
          fill
          sizes="40vw"
          className="object-cover object-center"
          unoptimized={product.imageSrc.endsWith(".svg")}
        />
        {discount && (
          <span className="absolute top-2 left-1.5 bg-paper px-1 py-0.5 font-sans text-[7px] leading-none font-bold text-ink">
            {discount}
          </span>
        )}
        <button
          type="button"
          aria-pressed={liked}
          aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}
          onClick={handleToggleWishlist}
          className="absolute top-1 right-1 inline-flex h-7 w-7 items-center justify-center border-0 bg-transparent p-0 text-paper/80 aria-pressed:text-red"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <path
              d="M12 20.3S3.5 15.4 1.6 10.4C.3 7 2 3.7 5.3 3.1c2-.4 4 .5 5.4 2.3l1.3 1.6 1.3-1.6c1.4-1.8 3.4-2.7 5.4-2.3 3.3.6 5 3.9 3.7 7.3C20.5 15.4 12 20.3 12 20.3z"
              fill={liked ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <div className="flex flex-1 flex-col px-1 pt-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="m-0 line-clamp-3 min-w-0 font-sans text-[10px] leading-[1.45] font-normal text-paper/80">
            {product.title}
          </h3>
          {(product.price || product.originalPrice) && (
            <div className="flex shrink-0 flex-col items-end gap-0.5 font-sans text-[9px] whitespace-nowrap">
              {discount && <span className="text-paper/30 line-through">{product.originalPrice}</span>}
              {product.price && <span className="text-paper/80">{product.price}</span>}
            </div>
          )}
        </div>

        <div className="mt-auto pt-4">
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              console.log(`Added ${product.title} to cart`);
            }}
            className="w-full cursor-pointer rounded-sm border border-paper/80 bg-transparent py-1.5 font-sans text-[10px] font-semibold text-paper transition-colors duration-200 hover:bg-paper hover:text-ink"
          >
            Add to bag
          </button>
        </div>
      </div>
    </article>
  );

  return product.href ? (
    <Link href={product.href} className="block h-full text-inherit no-underline">
      {card}
    </Link>
  ) : (
    card
  );
}

function MobilePagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  // Window of up to three page numbers around the current page.
  const start = Math.max(1, Math.min(page - 1, totalPages - 2));
  const pages = Array.from({ length: Math.min(3, totalPages) }, (_, i) => start + i);
  const cell =
    "inline-flex h-7 min-w-7 cursor-pointer items-center justify-center border-0 bg-transparent px-1.5 font-sans text-sm";

  return (
    <nav aria-label="Pagination" className="inline-flex items-center bg-paper px-1 text-ink">
      {page > 1 && (
        <button type="button" aria-label="Previous page" onClick={() => onChange(page - 1)} className={cell}>
          &lt;
        </button>
      )}
      {pages.map((p) => (
        <button
          key={p}
          type="button"
          aria-label={`Page ${p}`}
          aria-current={p === page ? "page" : undefined}
          onClick={() => onChange(p)}
          className={`${cell} ${p === page ? "font-semibold text-ink" : "text-ink/40"}`}
        >
          {p}
        </button>
      ))}
      {page < totalPages && (
        <button type="button" aria-label="Next page" onClick={() => onChange(page + 1)} className={cell}>
          &gt;
        </button>
      )}
    </nav>
  );
}

/** Mobile collection layout: subcategory rail on the left, a paged two-column product grid on the right. */
export default function CollectionMobile({
  categoryName,
  subcategories,
}: {
  categoryName: string;
  subcategories: CollectionSubcategory[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [page, setPage] = useState(1);
  const topRef = useRef<HTMLDivElement>(null);

  const active = subcategories[activeIndex];
  const products = active?.products ?? [];
  const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
  const visible = products.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const scrollToTop = () => {
    const top = topRef.current;
    if (top && top.getBoundingClientRect().top < 0) top.scrollIntoView({ behavior: "smooth" });
  };

  const selectSubcategory = (index: number) => {
    setActiveIndex(index);
    setPage(1);
    scrollToTop();
  };

  const changePage = (next: number) => {
    setPage(next);
    scrollToTop();
  };

  return (
    <div className="md:hidden">
      <div ref={topRef} className="scroll-mt-4 px-4 pt-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2.5 font-sans text-sm text-paper/80">
          <Link href="/" className="hover:text-paper">
            Home
          </Link>
          <span aria-hidden="true">&gt;</span>
          <Link href="/collections" className="hover:text-paper">
            Collections
          </Link>
          <span aria-hidden="true">&gt;</span>
          <span className="text-paper">{categoryName}</span>
        </nav>
      </div>

      <div className="mt-6 flex pr-4 pb-16">
        <aside className="sticky top-[var(--navbar-offset,0px)] w-[4.5rem] transition-[top] duration-300 shrink-0 self-start pt-4">
          <ul className="relative m-0 flex list-none flex-col gap-2 p-0">
            {/* One highlight slides between items (a gradient background can't be transitioned in place).
                Items share a fixed height, so its offset is just index × (item height + gap). */}
            <li
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-21 rounded-r-lg bg-linear-to-b from-ink to-red transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
              style={{ transform: `translateY(calc(${activeIndex} * (100% + 0.5rem)))` }}
            />
            {subcategories.map((subcategory, index) => {
              const isActive = index === activeIndex;
              return (
                <li key={subcategory.key} className="relative h-21">
                  <button
                    type="button"
                    aria-current={isActive ? "true" : undefined}
                    onClick={() => selectSubcategory(index)}
                    className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-1.5 border-0 bg-transparent px-1"
                  >
                    <span
                      className={`relative h-10 w-10 transition-transform duration-500 ${isActive ? "scale-110" : "scale-100"}`}
                    >
                      <Image
                        src={subcategory.iconSrc ?? subcategory.imageSrc}
                        alt=""
                        fill
                        sizes="40px"
                        className="object-contain"
                      />
                    </span>
                    <span
                      className={`w-full truncate text-center font-sans text-[10px] transition-colors duration-300 ${
                        isActive ? "font-semibold text-gold" : "text-paper/60"
                      }`}
                    >
                      {subcategory.title}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <div className="min-w-0 flex-1 border-l border-paper/50 pt-4 pl-3">
          {/* Keyed by subcategory + page so the cards remount and replay their staggered entrance. */}
          <div key={`${active?.key}-${page}`} className="grid grid-cols-2 gap-x-2.5 gap-y-8">
            {visible.map((product, index) => (
              <div
                key={product.key}
                className="animate-collection-card-in"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <MobileProductCard product={product} />
              </div>
            ))}
          </div>

          <p className="mt-10 mb-0 font-sans text-[11px] text-paper/80 underline underline-offset-2">
            {products.length} Results found
          </p>
          <div className="mt-6 flex justify-center">
            <MobilePagination page={page} totalPages={totalPages} onChange={changePage} />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
