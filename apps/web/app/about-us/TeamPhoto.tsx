"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";

export default function TeamPhoto() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      gsap.from("[data-photo]", { scale: 1.12, filter: "brightness(0.4)", duration: 2.2, ease: "power2.out" });
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

    </section>
  );
}
