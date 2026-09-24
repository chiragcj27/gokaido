"use client";

import Image from "next/image";
import { useState } from "react";
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

/**
 * Homepage "Visit Our Store": photo left, details right, and a row of city
 * dots underneath — picking a dot swaps the photo and details. All content
 * comes from the admin Stores page; the parent passes placeholders when none
 * exist yet.
 */
export default function StoreLocator({ stores, fallbackImage = "/stores/store-placeholder.png" }: StoreLocatorProps) {
  const [activeId, setActiveId] = useState(stores[0]?.id);
  if (stores.length === 0) return null;

  const active = stores.find((s) => s.id === activeId) ?? stores[0];

  return (
    <section className="w-full bg-black py-16 text-paper md:py-24">
      <div className="mx-auto w-full max-w-6xl px-4">
        <div className="grid items-center gap-8 md:grid-cols-[1.45fr_1fr] md:gap-14">
          <div className="relative aspect-[3/2] w-full overflow-hidden rounded-xl bg-panel">
            <Image
              // key remounts the image on switch so the previous photo never lingers while the next loads.
              key={active.id}
              src={active.image ?? fallbackImage}
              alt={`${active.name}, ${active.city}`}
              fill
              sizes="(min-width: 1152px) 640px, (min-width: 768px) 55vw, 100vw"
              className="object-cover"
            />
          </div>

          <div>
            <h2 className="font-heading text-4xl font-semibold leading-tight md:text-5xl lg:text-6xl">
              Visit Our
              <br />
              Store
            </h2>
            <h3 className="mt-6 font-heading text-2xl font-medium md:mt-8 md:text-3xl">{active.name}</h3>
            <p className="mt-5 max-w-md text-base leading-relaxed">{active.address}</p>
            {active.hours && <p className="mt-5 text-base">{active.hours}</p>}
            {active.phone && (
              <p className="mt-5 text-base">
                <a href={`tel:${active.phone.replace(/\s+/g, "")}`} className="hover:underline">
                  {active.phone}
                </a>
              </p>
            )}
            <a
              href={directionsHref(active)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-block rounded-xl bg-[#1a1a1a] px-8 py-4 text-sm font-semibold tracking-wide transition-colors hover:bg-[#2a2a2a]"
            >
              Get Direction
            </a>
          </div>
        </div>

        {/* Scrolls sideways when there are more cities than fit (always on
            mobile); min-w keeps each label readable instead of squeezing. */}
        <div className="mt-12 overflow-x-auto border-t border-paper/20 md:mt-16">
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
