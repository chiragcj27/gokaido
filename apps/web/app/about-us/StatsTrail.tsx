"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";

// Placeholder photos — swap for real brand/story images when the client provides them.
const IMAGES = [
  "/hero/showcase-1.png",
  "/about/founders.jpg",
  "/hero/showcase-2.png",
  "/stores/store-placeholder.png",
  "/hero/showcase-3.png",
  "/hero/hero-reel-poster.jpg",
];

const SPAWN_DISTANCE = 90;

export default function StatsTrail() {
  const rootRef = useRef<HTMLElement>(null);
  const tilesRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let next = 0;
    let z = 1;
    let last: { x: number; y: number } | null = null;

    const onMove = (e: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (!last) {
        last = { x, y };
        return;
      }
      if (Math.hypot(x - last.x, y - last.y) < SPAWN_DISTANCE) return;
      const from = last;
      last = { x, y };

      const tile = tilesRef.current[next];
      next = (next + 1) % IMAGES.length;
      if (!tile) return;

      // Start at the previous spawn point and glide to the cursor, so the trail reads as one continuous motion.
      gsap.killTweensOf(tile);
      gsap.set(tile, {
        x: from.x,
        y: from.y,
        xPercent: -50,
        yPercent: -50,
        zIndex: z++,
        scale: 0.6,
        opacity: 0,
        rotate: gsap.utils.random(-6, 6),
      });
      gsap
        .timeline()
        .to(tile, { x, y, scale: 1, opacity: 1, duration: 0.9, ease: "expo.out" })
        .to(tile, { scale: 0.85, opacity: 0, duration: 0.8, ease: "power2.inOut" }, 0.7);
    };
    const onLeave = () => {
      last = null;
    };

    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
    return () => {
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      gsap.killTweensOf(tilesRef.current);
    };
  }, []);

  return (
    <section ref={rootRef} className="relative isolate mx-auto max-w-360 px-4 py-16 sm:px-15 sm:py-24 lg:px-20">
      <ul className="relative z-10 m-0 flex list-none flex-col gap-8 p-0 font-heading text-[clamp(2rem,4.4vw,4rem)] leading-none font-extrabold text-red uppercase [text-shadow:0_2px_18px_rgb(0_0_0/0.75)] sm:gap-14">
        <li>1975 | 50+ Years</li>
        <li className="sm:self-end">18+ Franchisee</li>
        <li>Made in India</li>
      </ul>

      <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
        {IMAGES.map((src, i) => (
          <div
            key={src}
            ref={(el) => {
              tilesRef.current[i] = el;
            }}
            className="absolute top-0 left-0 h-44 w-36 overflow-hidden rounded-lg opacity-0 shadow-2xl will-change-transform sm:h-56 sm:w-44"
          >
            <Image src={src} alt="" fill sizes="176px" className="object-cover" />
          </div>
        ))}
      </div>
    </section>
  );
}
