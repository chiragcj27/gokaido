"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

// Placeholder awards — replace with Gokaido's real awards/recognitions when the client provides them.
const AWARDS = [
  { title: "Award Title 2024", note: "Category or nomination — short description of the recognition" },
  { title: "Award Title 2025", note: "Category or nomination — short description" },
  { title: "Award Title 2023", note: "Category or nomination — short description" },
  { title: "Award Title Longer Name 2025", note: "Finalist in the category — short description of the recognition" },
  { title: "Award Title 2023", note: "Category or nomination — short description" },
  { title: "Award Title 2025", note: "Category or nomination — short description" },
  { title: "Award Title 2023", note: "Nominee in the category — short description" },
  { title: "Award Title Longer Name 2024", note: "Category or nomination — short description" },
];

// Fixed scatter positions (% of the section); the cards trade these slots between them on each beat.
const SLOTS = [
  { left: 27, top: 1 },
  { left: 74, top: 3 },
  { left: 0, top: 25 },
  { left: 54, top: 27 },
  { left: 27, top: 49 },
  { left: 85, top: 52 },
  { left: 67, top: 77 },
  { left: 7, top: 81 },
];
const BEAT_SECONDS = 3.2;
const MOVE_SECONDS = 1.4;

// Random permutation where no card stays in its current slot, so every beat visibly moves them all.
const derange = (current: number[]) => {
  const next = [...current];
  do {
    for (let i = next.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [next[i], next[j]] = [next[j], next[i]];
    }
  } while (next.some((s, i) => s === current[i]));
  return next;
};

const pos = (slot: number) => ({ left: `${SLOTS[slot].left}%`, top: `${SLOTS[slot].top}%` });

export default function AwardsFloat() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const mm = gsap.matchMedia();
    mm.add("(min-width: 640px)", () => {
      const items = gsap.utils.toArray<HTMLElement>("[data-award]", root);
      let slots = items.map((_, i) => i);
      items.forEach((item, i) => gsap.set(item, pos(i)));

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      let beat: gsap.core.Tween | null = null;
      const tick = () => {
        slots = derange(slots);
        items.forEach((item, i) =>
          gsap.to(item, { ...pos(slots[i]), duration: MOVE_SECONDS, ease: "power3.inOut", overwrite: true }),
        );
        beat = gsap.delayedCall(BEAT_SECONDS, tick);
      };

      // Only keep the rhythm going while the section is on screen.
      const io = new IntersectionObserver(([entry]) => {
        beat?.kill();
        beat = entry.isIntersecting ? gsap.delayedCall(BEAT_SECONDS / 2, tick) : null;
      });
      io.observe(root);

      return () => {
        io.disconnect();
        beat?.kill();
      };
    });
    return () => mm.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      className="relative mx-auto grid max-w-360 grid-cols-2 gap-x-6 gap-y-10 overflow-hidden px-4 py-16 sm:block sm:aspect-2000/1192 sm:p-0"
    >
      <h2 className="sr-only">Awards</h2>
      {AWARDS.map((a, i) => (
        <div key={i} data-award className="group sm:absolute sm:w-[14%]">
          <h3 className="m-0 font-sans text-xl leading-tight font-normal text-paper/55 transition-colors duration-500 group-hover:text-paper sm:text-[clamp(1.25rem,2.1vw,2rem)]">
            {a.title}
          </h3>
          <p className="m-0 mt-3 font-sans text-[11px] leading-snug text-paper/35 transition-colors duration-500 group-hover:text-paper/70 sm:text-xs">
            {a.note}
          </p>
        </div>
      ))}
    </section>
  );
}
