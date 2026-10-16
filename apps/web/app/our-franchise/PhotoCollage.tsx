"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Collage box is 1160×540; every pose value below is a % of it, so the arrangement
// scales intact on any screen width.
const BOX_ASPECT = 1160 / 540;
const LINE_WIDTH = 31; // each photo's width once lined up
const LINE_GAP = 0.9; // ≈10px at 1160 wide
const LINE_LEFT = 2.6;

// `collage` is the pose traced off the design; `line` is where scrolling settles them —
// an even row of three, each centred vertically in the box.
const PHOTOS = [
  { src: "/franchise/office.png", alt: "Gokaido Sports head office reception", w: 529, h: 549, collage: { left: 2.6, top: 2.8, width: 31.5 } },
  { src: "/franchise/boardroom.png", alt: "Gokaido head office meeting room", w: 572, h: 572, collage: { left: 31.5, top: 9.3, width: 35.8 } },
  { src: "/franchise/storefront.png", alt: "Gokaido martial arts store front", w: 525, h: 525, collage: { left: 64, top: 28.7, width: 32.8 } },
].map((p, i) => ({
  ...p,
  line: {
    left: LINE_LEFT + i * (LINE_WIDTH + LINE_GAP),
    top: 50 - (LINE_WIDTH * BOX_ASPECT * (p.h / p.w)) / 2,
    width: LINE_WIDTH,
  },
}));

// Sunburst behind the collage: short rays that start some way out from the centre,
// with lengths/offsets varied deterministically so it renders the same on server and client.
const RAY_COUNT = 40;
const CENTER = { x: 580, y: 290 };
const RAYS = Array.from({ length: RAY_COUNT }, (_, i) => {
  const angle = (i / RAY_COUNT) * Math.PI * 2;
  const inner = 250 + 40 * Math.abs(Math.sin(i * 2.3));
  const outer = inner + 70 + 90 * Math.abs(Math.sin(i * 1.7 + 1));
  const at = (r: number) => ({
    x: +(CENTER.x + Math.cos(angle) * r).toFixed(1),
    y: +(CENTER.y + Math.sin(angle) * r).toFixed(1),
  });
  return { from: at(inner), to: at(outer) };
});

// Resting spin speed, as a multiple of one turn per 30s.
const BASE_SPIN = 0.7;
// The rays fan out from (580, 290) in the 1160×540 viewBox — spin and scale around that, not the box centre.
const RAYS_ORIGIN = `${(CENTER.x / 1160) * 100}% ${(CENTER.y / 540) * 100}%`;

const pct = (pose: { left: number; top: number; width: number }) => ({
  left: `${pose.left}%`,
  top: `${pose.top}%`,
  width: `${pose.width}%`,
});

/**
 * The three head-office/store photos start in the designed overlapping collage and,
 * as the page scrolls, slide into an even row — scrubbed 1:1 with scroll from the
 * top of the page until the collage's centre is 30% down the viewport. The rays
 * behind them swell slightly over the same scroll and keep slowly spinning.
 */
export default function PhotoCollage() {
  const boxRef = useRef<HTMLDivElement>(null);
  const raysRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    gsap.registerPlugin(ScrollTrigger);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    gsap.set(raysRef.current, { transformOrigin: RAYS_ORIGIN });
    const ctx = gsap.context(() => {
      const photos = gsap.utils.toArray<HTMLElement>("[data-photo]", box);
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: box,
          start: 0,
          end: "center 30%",
          scrub: reduceMotion ? true : 1,
          invalidateOnRefresh: true,
        },
      });
      photos.forEach((el, i) => tl.to(el, { ...pct(PHOTOS[i].line), ease: "none" }, 0));
      tl.fromTo(raysRef.current, { scale: 0.95 }, { scale: 1.05, ease: "none" }, 0);
    }, box);
    if (reduceMotion) return () => ctx.revert();

    // Rays slowly spin (a turn every ~43s at rest). Scrolling speeds the spin up in
    // proportion to scroll speed, and scrolling up turns it the other way.
    const rays = raysRef.current;
    const spin = gsap.to(rays, { rotation: 360, duration: 30, repeat: -1, ease: "none" });
    spin.timeScale(BASE_SPIN);
    let lastY = window.scrollY;
    let dir = 1;
    const tick = () => {
      const dy = window.scrollY - lastY;
      lastY = window.scrollY;
      if (dy !== 0) dir = Math.sign(dy);
      const target = BASE_SPIN * dir + gsap.utils.clamp(-2.5, 2.5, 0.1 * dy);
      spin.timeScale(gsap.utils.interpolate(spin.timeScale(), target, 0.15));
      // A repeating tween can't play backwards past its start, so wrap it round to the end.
      if (spin.timeScale() < 0 && spin.totalTime() <= 1e-4) spin.totalTime(spin.totalDuration());
    };
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      spin.kill();
      gsap.set(rays, { clearProps: "transform" });
      ctx.revert();
    };
  }, []);

  return (
    <div ref={boxRef} className="relative mt-[8%] aspect-1160/540">
      <svg
        ref={raysRef}
        aria-hidden
        viewBox="0 0 1160 540"
        overflow="visible"
        className="pointer-events-none absolute inset-0 h-full w-full text-paper/25"
      >
        {RAYS.map((r, i) => (
          <line key={i} x1={r.from.x} y1={r.from.y} x2={r.to.x} y2={r.to.y} stroke="currentColor" strokeWidth={1.5} />
        ))}
      </svg>

      {PHOTOS.map((p) => (
        <Image
          key={p.src}
          data-photo
          src={p.src}
          alt={p.alt}
          width={p.w}
          height={p.h}
          sizes="36vw"
          className="absolute h-auto object-contain"
          style={pct(p.collage)}
        />
      ))}
    </div>
  );
}
