"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";

const ACCENT = new Set(["ideas", "precision"]);
const WORDS = "Architects, designers, engineers a team built on ideas and precision".split(" ");

export default function TeamPhoto() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
      tl.from("[data-photo]", { scale: 1.12, filter: "brightness(0.4)", duration: 2.2, ease: "power2.out" })
        .from(
          "[data-word]",
          { yPercent: 110, rotate: 4, duration: 1.1, stagger: 0.07 },
          0.35,
        );
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      className="relative isolate h-[70svh] min-h-105 w-full overflow-hidden bg-black sm:aspect-2678/2206 sm:h-auto sm:min-h-0"
    >
      <Image
        data-photo
        src="/about/founders.jpg"
        alt="Gokaido's founders in the Gokaido store"
        fill
        priority
        sizes="100vw"
        className="object-cover object-top"
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 hidden h-[34%] bg-linear-to-b from-black from-20% via-black/80 via-55% to-transparent sm:block" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black via-black/60 to-transparent sm:h-1/5 sm:via-black/40" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 backdrop-blur-md mask-[linear-gradient(to_top,black_30%,transparent)] sm:h-[12%]" />

      <h2 className="absolute inset-x-0 bottom-0 m-0 px-4 pb-12 font-heading text-[clamp(1.75rem,3.2vw,3.75rem)] leading-[0.95] font-extrabold text-paper uppercase sm:top-0 sm:bottom-auto sm:w-[52%] sm:pt-[4vw] sm:pb-0 sm:pl-15 lg:pl-20">
        {WORDS.map((w, i) => (
          <span key={i}>
            <span className="inline-block overflow-hidden pb-[0.08em] align-bottom">
              <span data-word className={`inline-block ${ACCENT.has(w) ? "text-red" : ""}`}>
                {w}
              </span>
            </span>{" "}
          </span>
        ))}
      </h2>
    </section>
  );
}
