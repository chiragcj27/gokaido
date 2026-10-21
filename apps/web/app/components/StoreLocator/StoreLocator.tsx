"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import type { Store } from "../../lib/stores";

export interface StoreLocatorProps {
  stores: Store[];
  /** Shown when a store has no photo of its own. */
  fallbackImage?: string;
}

function directionsHref(store: Store) {
  return (
    store.directionsUrl ??
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${store.name} ${store.address}`)}`
  );
}

function telHref(phone: string) {
  return `tel:${phone.replace(/\s+/g, "")}`;
}

/**
 * Homepage "Visit Our Store": photo left, details right, and a row of city
 * dots underneath — picking a dot swaps the photo and details. All content
 * comes from the admin Stores page; the parent passes placeholders when none
 * exist yet.
 *
 * Phones: heading → photo → details → the same city dot row as desktop,
 * scrolling sideways with a red "next" arrow on its right. The photo also
 * swipes / has arrows to step through stores, and "Call" becomes a button.
 */
export default function StoreLocator({ stores, fallbackImage = "/stores/store-placeholder.png" }: StoreLocatorProps) {
  const [activeId, setActiveId] = useState(stores[0]?.id);
  const chipRowRef = useRef<HTMLUListElement>(null);
  const drag = useRef<{ x: number } | null>(null);
  // One-time nudge: the first time the row scrolls into view, slide it a
  // little and spring back, so it's visibly scrollable rather than relying
  // on the cut-off dot alone. Skipped if nothing overflows, the visitor has
  // already scrolled it, or they prefer reduced motion.
  useEffect(() => {
    const row = chipRowRef.current;
    if (!row || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer: number | undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        if (row.scrollLeft > 0 || row.scrollWidth <= row.clientWidth) return;
        timer = window.setTimeout(() => {
          row.scrollTo({ left: 72, behavior: "smooth" });
          timer = window.setTimeout(() => row.scrollTo({ left: 0, behavior: "smooth" }), 550);
        }, 400);
      },
      { threshold: 1 }
    );
    io.observe(row);
    return () => {
      io.disconnect();
      window.clearTimeout(timer);
    };
  }, []);

  // Keep the selected dot centred in the city row (e.g. after a swipe
  // on the photo picks a store whose chip is off to the side). Scrolls the
  // row only — scrollIntoView would also yank the page vertically.
  useEffect(() => {
    const row = chipRowRef.current;
    const chip = row?.querySelector<HTMLElement>(`[data-store-id="${activeId}"]`);
    if (!row || !chip) return;
    row.scrollTo({ left: chip.offsetLeft - (row.clientWidth - chip.offsetWidth) / 2, behavior: "smooth" });
  }, [activeId]);

  if (stores.length === 0) return null;

  const activeIndex = Math.max(
    0,
    stores.findIndex((s) => s.id === activeId)
  );
  const active = stores[activeIndex];
  const n = stores.length;
  const step = (delta: number) => setActiveId(stores[(activeIndex + delta + n) % n].id);

  // Swipe on the photo: a horizontal drag past 40px steps one store.
  // touch-action: pan-y keeps vertical page scroll working.
  function onPointerDown(e: PointerEvent) {
    drag.current = { x: e.clientX };
  }
  function onPointerUp(e: PointerEvent) {
    const start = drag.current;
    drag.current = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
  }

  return (
    <section className="w-full bg-black py-16 text-paper md:py-24">
      <div className="mx-auto w-full px-4 md:px-20">
        {/* Phones: the heading sits above the photo (desktop has it beside). */}
        <h2 className="font-heading text-4xl font-semibold leading-tight md:hidden">Visit Our Store</h2>

        <div className="mt-5 grid items-center gap-6 md:mt-0 md:grid-cols-[1.45fr_1fr] md:gap-14">
          <div
            className="relative aspect-3/2 w-full touch-pan-y overflow-hidden rounded-xl bg-panel"
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerCancel={() => (drag.current = null)}
          >
            <Image
              // key remounts the image on switch so the previous photo never lingers while the next loads.
              key={active.id}
              src={active.image ?? fallbackImage}
              alt={`${active.name}, ${active.city}`}
              fill
              sizes="(min-width: 1152px) 640px, (min-width: 768px) 55vw, 100vw"
              className="object-cover"
            />

            {/* Phones: arrows + counter so it's obvious the photo steps through stores. */}
            {n > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => step(-1)}
                  aria-label="Previous store"
                  className="absolute left-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-paper backdrop-blur md:hidden"
                >
                  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  aria-label="Next store"
                  className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-paper backdrop-blur md:hidden"
                >
                  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
                <span className="absolute bottom-2 right-2 rounded-full bg-black/55 px-2.5 py-1 text-xs tabular-nums backdrop-blur md:hidden">
                  {activeIndex + 1} / {n}
                </span>
              </>
            )}
          </div>

          <div>
            <h2 className="hidden font-heading text-4xl font-semibold leading-tight md:block md:text-5xl lg:text-6xl">
              Visit Our
              <br />
              Store
            </h2>
            <h3 className="font-heading text-2xl font-medium md:mt-8 md:text-3xl">{active.name}</h3>
            <p className="mt-3 max-w-md text-base leading-relaxed text-paper/85 md:mt-5 md:text-paper">{active.address}</p>
            {active.hours && <p className="mt-3 text-base md:mt-5">{active.hours}</p>}
            {active.phone && (
              <p className="mt-5 hidden text-base md:block">
                <a href={telHref(active.phone)} className="hover:underline">
                  {active.phone}
                </a>
              </p>
            )}
            <div className="mt-6 flex gap-3 md:mt-8">
              {active.phone && (
                <a
                  href={telHref(active.phone)}
                  className="flex-1 rounded-xl border border-paper/30 px-4 py-4 text-center text-sm font-semibold tracking-wide md:hidden"
                >
                  Call
                </a>
              )}
              <a
                href={directionsHref(active)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-xl bg-[#1a1a1a] px-8 py-4 text-center text-sm font-semibold tracking-wide transition-colors hover:bg-[#2a2a2a] md:inline-block md:flex-none"
              >
                Get Direction
              </a>
            </div>
          </div>
        </div>

        {/* City dots. Scrolls sideways when there are more cities than fit;
            a fixed/min width keeps each label readable instead of squeezing.
            py on the row leaves room for the selected dot's glow, which the
            scroll container would otherwise clip. Phones add a "next" arrow. */}
        <div className="mt-10 flex items-center gap-2 border-t border-paper/20 pt-4 md:mt-16 md:pt-6">
          <ul ref={chipRowRef} className="flex min-w-0 flex-1 overflow-x-auto py-2 md:justify-between">
            {stores.map((store) => {
              const selected = store.id === active.id;
              return (
                <li key={store.id} data-store-id={store.id} className="w-[4.5rem] shrink-0 md:w-auto md:min-w-[6.5rem] md:flex-1">
                  <button
                    type="button"
                    onClick={() => setActiveId(store.id)}
                    aria-pressed={selected}
                    className="group flex w-full flex-col items-center gap-4 text-sm"
                  >
                    <span
                      aria-hidden="true"
                      className={`h-4 w-4 rounded-full border-2 transition-all duration-200 ${
                        selected
                          ? "border-red bg-red shadow-[0_0_0_5px_rgba(200,16,46,0.3),0_0_16px_rgba(200,16,46,0.7)]"
                          : "border-paper/80 bg-paper group-hover:border-red"
                      }`}
                    />
                    <span className={selected ? "font-semibold" : "opacity-90 group-hover:opacity-100"}>
                      {store.city}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {n > 1 && (
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next store"
              className="mb-9 grid size-7 shrink-0 place-items-center rounded-full bg-red text-paper md:hidden"
            >
              <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
