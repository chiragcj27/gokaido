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
 * Phones get their own order: heading → city chips → photo → details. The
 * picker has to sit above what it changes, or a tap swaps content that's
 * already scrolled out of view. The photo also swipes / has arrows to step
 * through stores, and "Call" becomes a button.
 */
export default function StoreLocator({ stores, fallbackImage = "/stores/store-placeholder.png" }: StoreLocatorProps) {
  const [activeId, setActiveId] = useState(stores[0]?.id);
  const chipRowRef = useRef<HTMLUListElement>(null);
  const drag = useRef<{ x: number } | null>(null);
  // Which ends of the phone chip row have more chips hidden past them —
  // drives the edge fades and the arrow buttons.
  const [overflow, setOverflow] = useState({ left: false, right: false });

  useEffect(() => {
    const row = chipRowRef.current;
    if (!row) return;
    const update = () =>
      setOverflow({
        left: row.scrollLeft > 4,
        right: row.scrollLeft + row.clientWidth < row.scrollWidth - 4,
      });
    update();
    row.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      row.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [stores.length]);

  // One-time nudge: the first time the row scrolls into view, slide it a
  // little and spring back, so it's visibly scrollable rather than relying
  // on the cut-off chip alone. Skipped if nothing overflows, the visitor has
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

  const scrollChips = (dir: 1 | -1) => {
    const row = chipRowRef.current;
    row?.scrollBy({ left: dir * row.clientWidth * 0.7, behavior: "smooth" });
  };

  // Keep the selected chip centred in the phone chip row (e.g. after a swipe
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
        {/* Phones: heading + city chips first, above the content they control. */}
        <div className="md:hidden">
          <h2 className="font-heading text-4xl font-semibold leading-tight">Visit Our Store</h2>
          <div className="relative -mx-4 mt-5">
            <ul
              ref={chipRowRef}
              className="relative flex snap-x scroll-px-4 gap-2 overflow-x-auto px-4 pb-1"
              style={{
                // Fade only the edge(s) that actually have more chips past them.
                maskImage: `linear-gradient(to right, ${overflow.left ? "transparent, #000 14%" : "#000, #000"}, ${
                  overflow.right ? "#000 86%, transparent" : "#000"
                })`,
              }}
            >
              {stores.map((store) => {
                const selected = store.id === active.id;
                return (
                  <li key={store.id} data-store-id={store.id} className="shrink-0 snap-start">
                    <button
                      type="button"
                      onClick={() => setActiveId(store.id)}
                      aria-pressed={selected}
                      className={`rounded-full border px-4 py-2 text-sm transition-colors duration-200 ${
                        selected
                          ? "border-red bg-red font-semibold text-paper"
                          : "border-paper/25 bg-transparent text-paper/85"
                      }`}
                    >
                      {store.city}
                    </button>
                  </li>
                );
              })}
            </ul>
            {/* Arrow buttons over the faded edges — the explicit "there's more"
                cue. Each shows only while that side has hidden chips. */}
            {(
              [
                [-1, overflow.left, "left-1", "Show previous stores", "m15 18-6-6 6-6"],
                [1, overflow.right, "right-1", "Show more stores", "m9 18 6-6-6-6"],
              ] as const
            ).map(([dir, show, side, label, path]) => (
              <button
                key={dir}
                type="button"
                onClick={() => scrollChips(dir)}
                aria-label={label}
                tabIndex={show ? 0 : -1}
                className={`absolute ${side} top-[calc(50%-2px)] grid size-8 -translate-y-1/2 place-items-center rounded-full border border-paper/25 bg-black text-paper shadow-[0_0_12px_6px_#000] transition-opacity duration-200 ${
                  show ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
              >
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d={path} />
                </svg>
              </button>
            ))}
          </div>
        </div>

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

        {/* Desktop city dots. Scrolls sideways when there are more cities than
            fit; min-w keeps each label readable instead of squeezing. */}
        <div className="mt-16 hidden overflow-x-auto border-t border-paper/20 md:block">
          <ul className="flex min-w-max justify-between pt-8 md:min-w-0">
            {stores.map((store) => {
              const selected = store.id === active.id;
              return (
                <li key={store.id} className="min-w-[6.5rem] flex-1">
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
        </div>
      </div>
    </section>
  );
}
