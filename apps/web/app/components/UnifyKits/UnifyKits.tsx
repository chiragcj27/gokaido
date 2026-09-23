"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export interface KitCategory {
  name: string;
  image: string;
}

export interface UnifyKitsProps {
  categories: KitCategory[];
  backgroundUrl?: string;
}

/**
 * Keyframes for a card by its distance from the centre slot (0 = front,
 * 1 = first neighbour, 2 = far edge, 3 = hidden behind the edge). Values in
 * between are linearly interpolated, which is what makes the cards glide
 * round the ring as the scroll position moves between whole indices.
 * x/y are in vw so the whole ring scales with the viewport like the design.
 */
interface RingKeyframes {
  cardWidth: number; // vw
  x: number[];
  y: number[];
  scale: number[];
  opacity: number[];
  brightness: number[];
}

const DESKTOP: RingKeyframes = {
  cardWidth: 38,
  x: [0, 28, 43, 52],
  y: [0, 2, 3.5, 4],
  scale: [1, 0.47, 0.34, 0.25],
  opacity: [1, 1, 1, 0],
  brightness: [1, 0.72, 0.5, 0.4],
};

// Narrow screens: bigger front card, neighbours pushed mostly off-screen so
// only their edges peek in.
const MOBILE: RingKeyframes = {
  cardWidth: 78,
  x: [0, 56, 82, 100],
  y: [0, 4, 7, 8],
  scale: [1, 0.55, 0.4, 0.3],
  opacity: [1, 1, 1, 0],
  brightness: [1, 0.65, 0.45, 0.4],
};

function sample(values: number[], at: number) {
  const a = Math.min(Math.max(at, 0), values.length - 1);
  const i = Math.min(Math.floor(a), values.length - 2);
  const t = a - i;
  return values[i] + (values[i + 1] - values[i]) * t;
}

/**
 * "Unify your kits": one card per category laid out on a ring — front card
 * big and centred, neighbours shrinking and dimming towards the edges. The
 * section pins while you scroll through it, and scroll progress rotates the
 * ring so each category takes its turn at the front (snapping to whole
 * cards when scrolling stops).
 *
 * The ring wraps: a card's offset from the front is taken modulo the count,
 * so a card leaving past one edge re-enters from the other. It fades out
 * at offset ≥ 2.5 (see `opacity`) so the jump across isn't visible.
 *
 * Cards are positioned by writing transforms directly each scroll tick
 * rather than via React state — five elements, no re-renders.
 */
export default function UnifyKits({ categories, backgroundUrl }: UnifyKitsProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const section = sectionRef.current;
    const count = categories.length;
    if (!section || count === 0) return;

    gsap.registerPlugin(ScrollTrigger);

    const mobileQuery = window.matchMedia("(max-width: 767px)");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ring = { p: 0 };

    function render() {
      const kf = mobileQuery.matches ? MOBILE : DESKTOP;
      cardRefs.current.forEach((card, i) => {
        if (!card) return;
        // Signed offset from the front, wrapped into [-count/2, count/2).
        let d = (((i - ring.p) % count) + count) % count;
        if (d >= count / 2) d -= count;
        const dist = Math.abs(d);
        const side = Math.sign(d);

        card.style.width = `${kf.cardWidth}vw`;
        card.style.transform =
          `translate(-50%, -50%) translate3d(${side * sample(kf.x, dist)}vw, ${sample(kf.y, dist)}vw, 0) ` +
          `scale(${sample(kf.scale, dist)})`;
        card.style.opacity = String(sample(kf.opacity, dist));
        card.style.filter = `brightness(${sample(kf.brightness, dist)})`;
        card.style.zIndex = String(100 - Math.round(dist * 10));
      });
    }

    render();

    if (reduceMotion || count < 2) {
      mobileQuery.addEventListener("change", render);
      return () => mobileQuery.removeEventListener("change", render);
    }

    const ctx = gsap.context(() => {
      gsap.to(ring, {
        p: count - 1,
        ease: "none",
        onUpdate: render,
        scrollTrigger: {
          trigger: section,
          start: "top top",
          // ~70% of a viewport of scroll per card step.
          end: () => `+=${window.innerHeight * 0.7 * (count - 1)}`,
          pin: true,
          scrub: 1,
          snap: { snapTo: 1 / (count - 1), duration: { min: 0.2, max: 0.5 }, ease: "power2.inOut" },
          invalidateOnRefresh: true,
        },
      });
    }, section);

    mobileQuery.addEventListener("change", render);
    return () => {
      mobileQuery.removeEventListener("change", render);
      ctx.revert();
    };
  }, [categories.length]);

  return (
    <section ref={sectionRef} className="relative h-screen w-full overflow-hidden bg-ink text-paper">
      {backgroundUrl && (
        <Image src={backgroundUrl} alt="" fill sizes="100vw" className="object-cover" />
      )}

      <h2 className="absolute inset-x-0 top-[13%] z-10 text-center font-heading text-[9vw] font-extrabold uppercase leading-none tracking-tight sm:text-[4.6vw]">
        Unify Your Kits
      </h2>

      {/* Ring stage. Cards are absolutely centred here and moved purely by
          the transform written in render(); initial styles below only cover
          the first paint before the effect runs. */}
      <div className="absolute inset-x-0 top-[57%] bottom-0 sm:top-[55%]">
        {categories.map((category, i) => (
          <div
            key={category.name}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            className="absolute left-1/2 top-0 aspect-[4/3] w-[38vw] origin-center overflow-hidden rounded-[1vw] border border-white/5 bg-[radial-gradient(ellipse_at_50%_35%,#3a3a3a,#111_62%,#070707)] shadow-[0_2vw_5vw_rgba(0,0,0,0.7)] will-change-transform"
            style={{ transform: "translate(-50%, -50%)", opacity: i === 0 ? 1 : 0 }}
          >
            {/* Font sizes are in card-relative vw at scale 1 — the card's
                own scale() shrinks the label along with it on the sides. */}
            <div className="absolute inset-x-0 top-[8%] z-10 text-center font-heading text-[4.6vw] font-extrabold uppercase leading-none max-sm:text-[8.5vw]">
              {category.name}
            </div>
            <div className="absolute inset-x-[12%] bottom-[6%] top-[24%]">
              <Image
                src={category.image}
                alt={category.name}
                fill
                sizes="(max-width: 767px) 72vw, 38vw"
                className="object-contain drop-shadow-[0_1.5vw_2vw_rgba(0,0,0,0.6)]"
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
