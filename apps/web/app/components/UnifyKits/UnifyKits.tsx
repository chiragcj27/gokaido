"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export interface KitCategory {
  name: string;
  image: string;
  /** Collection page the card opens. */
  href: string;
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
  cardWidth: 30,
  x: [0, 22, 34, 41],
  y: [0, 2, 3.5, 4],
  scale: [1, 0.47, 0.34, 0.25],
  opacity: [1, 1, 1, 0],
  brightness: [1, 0.72, 0.5, 0.4],
};

// Narrow screens: a mid-size front card with two neighbours fully in view on
// each side, tucked behind it — the first half-size, the second smaller still
// towards the edge.
const MOBILE: RingKeyframes = {
  cardWidth: 48,
  x: [0, 27, 41, 50],
  y: [0, -1, -1.5, -1.5],
  scale: [1, 0.5, 0.32, 0.2],
  opacity: [1, 1, 1, 0],
  brightness: [1, 0.8, 0.65, 0.5],
};

function sample(values: number[], at: number) {
  const a = Math.min(Math.max(at, 0), values.length - 1);
  const i = Math.min(Math.floor(a), values.length - 2);
  const t = a - i;
  return values[i] + (values[i + 1] - values[i]) * t;
}

/**
 * "Unify your kits": one card per category laid out on a ring — front card
 * big and centred, neighbours shrinking and dimming towards the edges. On
 * desktop the section pins while you scroll through it, and scroll progress
 * rotates the ring so each category takes its turn at the front (snapping to
 * whole cards when scrolling stops). On phones it doesn't pin; the ring is
 * turned by swiping horizontally instead. Each card links to its collection.
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
  const cardRefs = useRef<(HTMLAnchorElement | null)[]>([]);

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
        const opacity = sample(kf.opacity, dist);
        card.style.opacity = String(opacity);
        // Faded-out cards sit behind the edge — keep them from catching clicks.
        card.style.pointerEvents = opacity < 0.05 ? "none" : "auto";
        card.style.filter = `brightness(${sample(kf.brightness, dist)})`;
        card.style.zIndex = String(100 - Math.round(dist * 10));
      });
    }

    render();
    if (count < 2) {
      mobileQuery.addEventListener("change", render);
      return () => mobileQuery.removeEventListener("change", render);
    }

    const mm = gsap.matchMedia();

    // Desktop: the section pins and scroll progress rotates the ring.
    // Reduced motion keeps the pinned, scroll-driven ring (it moves only in
    // lockstep with the visitor's own scroll) but drops the scrub lag and the
    // auto-snap, which is motion the visitor didn't make.
    mm.add("(min-width: 768px)", () => {
      ring.p = 0;
      render();
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
          scrub: reduceMotion ? true : 1,
          snap: reduceMotion
            ? undefined
            : { snapTo: 1 / (count - 1), duration: { min: 0.2, max: 0.5 }, ease: "power2.inOut" },
          invalidateOnRefresh: true,
        },
      });
    });

    // Phones: no pin — the page scrolls past normally and the ring only turns
    // when the visitor swipes it sideways. The ring follows the finger, then
    // settles on the nearest card (a short flick still advances one card).
    // Vertical drags are left to the browser via `touch-action: pan-y`.
    mm.add("(max-width: 767px)", () => {
      ring.p = (((Math.round(ring.p) % count) + count) % count);
      render();

      let startX = 0;
      let startY = 0;
      let startP = 0;
      let tracking = false;
      let dragging = false;
      let suppressClick = false;
      // Swipe distance that moves the ring one card: the gap between the
      // front card and its neighbour (MOBILE.x[1] vw).
      const step = () => (window.innerWidth * MOBILE.x[1]) / 100;

      function settle(target: number) {
        gsap.to(ring, {
          p: target,
          duration: reduceMotion ? 0 : 0.45,
          ease: "power2.out",
          onUpdate: render,
          overwrite: true,
        });
      }

      function onDown(e: PointerEvent) {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        gsap.killTweensOf(ring);
        startX = e.clientX;
        startY = e.clientY;
        startP = ring.p;
        tracking = true;
        dragging = false;
      }

      function onMove(e: PointerEvent) {
        if (!tracking) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        if (!dragging) {
          if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
            tracking = false; // vertical scroll — not ours
            return;
          }
          if (Math.abs(dx) < 10) return;
          dragging = true;
        }
        ring.p = startP - dx / step();
        render();
      }

      function onUp(e: PointerEvent) {
        if (!tracking) return;
        tracking = false;
        if (!dragging) return;
        dragging = false;
        suppressClick = true; // the click that follows a swipe isn't a tap
        const dx = e.clientX - startX;
        let target = Math.round(ring.p);
        if (target === Math.round(startP) && Math.abs(dx) > 30) target -= Math.sign(dx);
        settle(target);
      }

      function onCancel() {
        if (!tracking) return;
        tracking = false;
        if (dragging) {
          dragging = false;
          settle(Math.round(ring.p));
        }
      }

      function onClick(e: MouseEvent) {
        if (suppressClick) {
          e.preventDefault();
          e.stopPropagation();
          suppressClick = false;
        }
      }

      function onPointerDownReset() {
        suppressClick = false;
      }

      section.addEventListener("pointerdown", onPointerDownReset, true);
      section.addEventListener("pointerdown", onDown);
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onCancel);
      section.addEventListener("click", onClick, true);

      return () => {
        gsap.killTweensOf(ring);
        section.removeEventListener("pointerdown", onPointerDownReset, true);
        section.removeEventListener("pointerdown", onDown);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onCancel);
        section.removeEventListener("click", onClick, true);
      };
    });

    return () => mm.revert();
  }, [categories.length]);

  return (
        // Phones: 3/4 of the screen, heading and ring stacked as one group and
    // centred vertically (desktop keeps the full-screen absolute layout).
    <section ref={sectionRef} className="relative h-screen w-full overflow-hidden bg-ink text-paper max-md:flex max-md:h-[75svh] max-md:touch-pan-y max-md:select-none max-md:flex-col max-md:justify-center max-md:gap-[8vw]">
      {backgroundUrl && (
        <Image src={backgroundUrl} alt="" fill sizes="100vw" className="object-cover" />
      )}

      <h2 className="absolute inset-x-0 top-[8%] z-10 text-center font-heading text-[6vw] font-bold uppercase leading-none tracking-tight max-md:relative max-md:top-auto md:text-[4.6vw]">
        Unify Your Kits
      </h2>

      {/* Ring stage. Cards are absolutely centred here and moved purely by
          the transform written in render(); initial styles below only cover
          the first paint before the effect runs. On phones it's an in-flow
          box one card tall, with the cards centred in it. */}
      <div className="absolute inset-x-0 bottom-0 top-[55%] max-md:relative max-md:inset-auto max-md:h-[56vw]">
        {categories.map((category, i) => (
          <Link
            key={category.name}
            href={category.href}
            aria-label={`Shop ${category.name}`}
            draggable={false}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            className="absolute left-1/2 top-0 max-md:top-1/2 flex aspect-[4/3] w-[30vw] origin-center flex-col will-change-transform max-md:aspect-[12/13]"
            style={{ transform: "translate(-50%, -50%)", opacity: i === 0 ? 1 : 0, pointerEvents: i === 0 ? "auto" : "none" }}
          >
            {/* Font sizes are in card-relative vw at scale 1 — the card's
                own scale() shrinks the label along with it on the sides.
                3.33vw = 64px on the 1920px-wide design. Phones use a taller
                card so the photo under the label stays roughly 6:5. */}
            <div className="mb-[1vw] text-center font-heading text-[3.33vw] font-extrabold uppercase leading-none max-md:mb-[5vw] max-md:text-[6vw]">
              {category.name}
            </div>
            {/* Category card image: a full-bleed photo, centre-cropped. Title +
                image together keep the card at 4:3, so the image takes
                whatever height the title leaves. */}
            <div className="relative min-h-0 w-full flex-1 overflow-hidden rounded-[1vw] border border-white/5 bg-ink shadow-[0_2vw_5vw_rgba(0,0,0,0.7)]">
              <Image
                src={category.image}
                alt={category.name}
                fill
                draggable={false}
                sizes="(max-width: 767px) 48vw, 30vw"
                className="object-cover"
              />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
