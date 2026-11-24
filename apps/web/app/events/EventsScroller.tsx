"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { GokaidoEvent } from "../lib/events";

// Pinned "selected work" scroller, after huyml.co (desktop and phone layouts both
// measured off its page and a 60fps screencast of it). The section pins for most of a
// screen of scroll per event, but the visuals don't follow the scroll: a small scroll
// commits one step and a timed tween carries one progress value (0 … n-1) there, which
// drives the photo track, the event list, the counter and the meta. Transforms are written
// straight to the DOM; React only re-renders when the nearest event changes.

const SCROLL_PER_EVENT = 0.9; // viewport heights of scroll per event

const pad = (n: number) => String(n).padStart(2, "0");

// Desktop photo track, measured at 1440×900 — [d, x vw, y vh, rotateY°, rotateZ°, scaleX,
// brightness] with the active photo at d = 0. Coming events stack at the bottom-left under
// the counter; past ones leave to the top-right and fold into thin strips that fan up
// into the corner, each a step right *and* higher (bottom edges ~175 → 120 → 70px at 900
// tall). The folding is a flat scaleX, not a real rotateY: in true perspective a card
// turned edge-on that far from the vanishing point projects tall and low, nothing like the
// reference's short strips.
const D_TRACK: [number, number, number, number, number, number, number][] = [
  [-5, 30.5, -65.5, 0, 9, 0.12, 0.75],
  [-4, 28.6, -59.5, 0, 9, 0.12, 0.75],
  [-3, 26.7, -54, 0, 9, 0.12, 0.75],
  [-2, 24.6, -52.7, 0, 9, 0.13, 0.8],
  [-1, 12, -45, -6, 9, 1, 1],
  [0, 0, 0, 0, 1, 1, 1],
  [1, -19.3, 54.4, 0, 9, 1, 1],
  [2, -21.1, 60.1, 0, 9, 1, 1],
  [3, -23, 65.8, 0, 9, 1, 1],
  [4, -24.9, 71.5, 0, 9, 1, 1],
];

function cardStyle(d: number, reduced: boolean): CSSProperties {
  const first = D_TRACK[0];
  const last = D_TRACK[D_TRACK.length - 1];
  const c = Math.min(Math.max(d, first[0]), last[0]);
  const k = Math.min(Math.floor(c - first[0]), D_TRACK.length - 2);
  const [d0, x0, y0, ry0, rz0, sx0, b0] = D_TRACK[k];
  const [, x1, y1, ry1, rz1, sx1, b1] = D_TRACK[k + 1];
  const t = c - d0;
  const lerp = (u: number, v: number) => u + (v - u) * t;
  const opacity = d < -4 ? Math.max(0, 1 - (-4 - d)) : d > 3.5 ? 0 : 1;
  const zIndex = 100 - Math.round(Math.abs(d) * 10);
  const move = `translate3d(${lerp(x0, x1)}vw, ${lerp(y0, y1)}vh, 0)`;
  if (reduced) return { transform: move, opacity, zIndex };
  return {
    transform: `${move} rotateY(${lerp(ry0, ry1)}deg) rotateZ(${lerp(rz0, rz1)}deg) scaleX(${lerp(sx0, sx1)})`,
    filter: `brightness(${lerp(b0, b1)})`,
    opacity,
    zIndex,
  };
}

// Phones, after huyml.co's mobile view (measured off a 60fps screencast of it): the photos
// sit on one straight diagonal track — the previous event's parked off the top-right
// corner, the next one peeking from the bottom-left, the rest further out along the same
// line — and keep their size, rotating from ~2° in the middle to ~9° in the corners.
// Offsets are in vw / svh because the track runs between the screen's corners.
const M_NEXT = [-60, 57] as const; // where photo d = +1 sits — only its corner shows
const M_PREV = [46, -45] as const; // where photo d = -1 sits

function mobileCardStyle(d: number, reduced: boolean): CSSProperties {
  const a = Math.abs(d);
  const [vx, vy] = d > 0 ? M_NEXT : M_PREV;
  const opacity = a < 2.2 ? 1 : 0; // beyond that they're off-screen anyway
  const zIndex = 100 - Math.round(a * 10);
  if (reduced) return { transform: `translate3d(${vx * a}vw, ${vy * a}svh, 0)`, opacity, zIndex };
  return {
    transform:
      `translate3d(${vx * a}vw, ${vy * a}svh, 0) perspective(900px) ` +
      `rotateY(${-d * 10}deg) rotateZ(${2 + Math.min(a, 1) * 7}deg)`,
    opacity,
    zIndex,
  };
}

// A small scroll commits to the next / previous event and the photos then travel on
// their own, on huyml's curve (fitted to its frames) — same on desktop and phones.
const M_COMMIT = 0.06; // fraction of one event's scroll that commits the step
const M_DURATION = 0.75; // s
function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const at = (p1: number, p2: number, t: number) => 3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t * t * p2 + t ** 3;
  return (x: number) => {
    let lo = 0;
    let hi = 1;
    for (let k = 0; k < 24; k++) {
      const t = (lo + hi) / 2;
      if (at(x1, x2, t) < x) lo = t;
      else hi = t;
    }
    return at(y1, y2, (lo + hi) / 2);
  };
}
const M_EASE = cubicBezier(0.4, 0.05, 0.4, 1);

// Counter, meta + text: the outgoing one vanishes at once (no transition on the way out),
// the incoming one fades in fast and sharpens slowly out of a heavy blur.
const BLUR_IN =
  "opacity-100 blur-none transition-[opacity,filter] duration-[300ms,950ms] ease-[cubic-bezier(0.2,0.6,0.3,1)]";
const BLURRED = "opacity-0 blur-[10px]";

function useIstClock() {
  const [time, setTime] = useState<string | null>(null);
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Kolkata",
    });
    const update = () => setTime(fmt.format(new Date()));
    update();
    const id = window.setInterval(update, 15_000);
    return () => window.clearInterval(id);
  }, []);
  return time;
}

// Desktop meta, laid out like the reference's: a short first column (label + value 5vw
// apart) and a wider second one from 13.75vw.
function DeskMeta({ event }: { event: GokaidoEvent }) {
  const pair = (label: string, value?: string) =>
    value ? (
      <div key={label} className="flex">
        <dt className="w-[6.25vw] shrink-0 text-[11px] leading-[1.3] text-paper/50">{label}</dt>
        <dd className="m-0 text-[11px] leading-[1.3] text-paper">{value}</dd>
      </div>
    ) : null;
  return (
    <dl className="m-0 flex text-[11px]">
      <div className="flex w-[13.75vw] shrink-0 flex-col gap-y-14 pr-4 [&_dt]:w-[3.75vw]">
        {pair("Sport", event.sport)}
        {pair("Dates", event.dates)}
      </div>
      <div className="flex min-w-0 flex-col gap-y-14">
        {pair("Event place", event.place)}
        {pair("Recognition", event.recognition)}
        {pair("Hosted by", event.hostedBy)}
      </div>
    </dl>
  );
}

export default function EventsScroller({ events }: { events: GokaidoEvent[] }) {
  const n = events.length;
  const [active, setActive] = useState(0);
  const clock = useIstClock();

  const sectionRef = useRef<HTMLElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const mCardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const listWrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const triggerRef = useRef<ScrollTrigger | null>(null);
  const slugsRef = useRef<string[]>([]);
  slugsRef.current = events.map((e) => e.slug);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || n < 2) return;
    gsap.registerPlugin(ScrollTrigger);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let target = 0; // scroll position, in events
    const m = { p: 0, idx: 0 }; // committed event + its tweened visual position
    let lastActive = 0;
    let centers: number[] = [];
    let wrapH = 0;

    const measure = () => {
      centers = itemRefs.current.map((li) => (li ? li.offsetTop + li.offsetHeight / 2 : 0));
      wrapH = listWrapRef.current?.clientHeight ?? 0;
    };

    const apply = () => {
      const p = m.p;
      cardRefs.current.forEach((el, i) => {
        if (!el) return;
        const s = cardStyle(i - p, reduced);
        el.style.transform = String(s.transform);
        el.style.filter = s.filter ? String(s.filter) : "";
        el.style.opacity = String(s.opacity);
        el.style.zIndex = String(s.zIndex);
        el.style.pointerEvents = Math.abs(i - p) < 0.5 ? "auto" : "none";
      });
      mCardRefs.current.forEach((el, i) => {
        if (!el) return;
        const s = mobileCardStyle(i - p, reduced);
        el.style.transform = String(s.transform);
        el.style.opacity = String(s.opacity);
        el.style.zIndex = String(s.zIndex);
        // Only the photo in the middle is tappable — the corner ones are decoration.
        el.style.pointerEvents = Math.abs(i - p) < 0.5 ? "auto" : "none";
      });

      // Desktop list: keep the interpolated position centred in its column.
      const lo = Math.floor(p);
      const hi = Math.min(lo + 1, n - 1);
      const c = (centers[lo] ?? 0) + ((centers[hi] ?? 0) - (centers[lo] ?? 0)) * (p - lo);
      if (listRef.current) listRef.current.style.transform = `translate3d(0, ${wrapH / 2 - c}px, 0)`;
      itemRefs.current.forEach((li, i) => {
        if (li) li.style.opacity = String(Math.max(0.2, 1 - Math.abs(i - p) * 0.8));
      });

      // Text, meta and counter swap at the midpoint, as on the reference.
      const nearest = Math.round(p);
      if (nearest !== lastActive) {
        lastActive = nearest;
        setActive(nearest);
      }
    };

    const go = (idx: number) => {
      if (idx === m.idx) return;
      const steps = Math.abs(idx - m.idx);
      m.idx = idx;
      gsap.to(m, {
        p: idx,
        duration: reduced ? 0 : M_DURATION + 0.12 * (steps - 1),
        ease: M_EASE,
        overwrite: true,
        onUpdate: apply,
      });
    };

    // Commit once the scroll has moved a little past the current event in the direction of
    // travel. Direction matters: right after a commit the scroll is still short of the new
    // event (the directional snap below brings it along), which must not read as a step back.
    const commit = (direction: number) => {
      if (direction > 0 && target > m.idx + M_COMMIT) go(Math.min(n - 1, Math.ceil(target - M_COMMIT)));
      else if (direction < 0 && target < m.idx - M_COMMIT) go(Math.max(0, Math.floor(target + M_COMMIT)));
    };

    measure();
    apply();

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: () => `+=${(n - 1) * window.innerHeight * SCROLL_PER_EVENT}`,
      pin: true,
      invalidateOnRefresh: true,
      snap: {
        snapTo: 1 / (n - 1),
        directional: true, // a small scroll settles on the next event, not back — matching the commit
        duration: { min: 0.25, max: 0.7 },
        delay: 0.08,
        ease: "power2.inOut",
        // Safety net: wherever the scroll finally settles is the event shown.
        onComplete: () => go(Math.round(target)),
      },
      onUpdate: (self) => {
        target = self.progress * (n - 1);
        commit(self.direction);
      },
      onRefresh: measure,
    });
    triggerRef.current = trigger;

    // "← All events" on a detail page links to /events#{slug}: open at that event
    // instead of the top (instant jump, no animation through the ones before it).
    const fromHash = decodeURIComponent(window.location.hash.slice(1));
    const startAt = fromHash ? slugsRef.current.indexOf(fromHash) : -1;
    if (startAt > 0) {
      target = m.p = m.idx = startAt;
      apply();
      window.scrollTo({ top: trigger.start + (trigger.end - trigger.start) * (startAt / (n - 1)), behavior: "instant" });
    }

    const ro = new ResizeObserver(() => {
      measure();
      apply();
    });
    if (listWrapRef.current) ro.observe(listWrapRef.current);

    return () => {
      gsap.killTweensOf(m);
      ro.disconnect();
      trigger.kill();
      triggerRef.current = null;
    };
  }, [n]);

  const goTo = (i: number) => {
    const st = triggerRef.current;
    if (!st) return;
    window.scrollTo({ top: st.start + (st.end - st.start) * (i / (n - 1)), behavior: "smooth" });
  };

  const current = events[active];

  const pager = (
    <div className="flex gap-1.5" role="group" aria-label="Jump to event">
      {events.map((e, i) => (
        <button
          key={e.id}
          type="button"
          onClick={() => goTo(i)}
          aria-label={`${e.name}, ${e.year}`}
          aria-current={i === active}
          className={`size-3 cursor-pointer border-0 p-0 transition-colors duration-300 ${
            i === active ? "bg-paper" : "bg-paper/20 hover:bg-paper/50"
          }`}
        />
      ))}
    </div>
  );

  return (
    <section
      ref={sectionRef}
      aria-label="Gokaido events"
      className="relative h-svh overflow-hidden bg-ink"
    >
      {/* Desktop — huyml.co's layout, positions measured at 1440×900 and scaled in vw / vh. */}
      <div className="absolute inset-0 hidden lg:block">
        {/* Top strip (below the site navbar while it shows) */}
        <div className="absolute top-[calc(var(--navbar-h)+1.25rem)] left-[50.8vw] z-40">
          <h1 className="m-0 font-heading text-[11px] font-semibold tracking-wide text-paper uppercase">Gokaido Events</h1>
          <p className="m-0 mt-0.5 text-[11px] text-paper/50">Mumbai{clock ? `, ${clock}` : ""}</p>
        </div>
        <p className="absolute top-[calc(var(--navbar-h)+1.25rem)] right-5 z-40 m-0 text-[11px] text-paper/50">
          For enquiries
          <Link href="/contact-us" className="ml-3 text-paper underline underline-offset-4 hover:text-gold">
            Contact us
          </Link>
        </p>

        {/* Left: meta */}
        <div className="absolute top-[41.5vh] left-5 z-20 grid w-[calc(35vw-1.25rem)]">
          {events.map((e, i) => (
            <div
              key={e.id}
              aria-hidden={i !== active}
              className={`col-start-1 row-start-1 ${i === active ? BLUR_IN : `pointer-events-none ${BLURRED}`}`}
            >
              <DeskMeta event={e} />
            </div>
          ))}
        </div>
        <span className="absolute bottom-5 left-5 z-20 text-[11px] text-paper/50">Scroll</span>

        {/* Centre: photo track */}
        <div className="absolute inset-0 z-20 perspective-[1400px]">
          <div className="absolute top-[50.5%] left-[49vw] aspect-5/4 w-[min(26vw,41vh)] -translate-x-1/2 -translate-y-1/2 transform-3d">
            {events.map((e, i) => (
              <div
                key={e.id}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                className="absolute inset-0 transform-3d will-change-transform"
                style={cardStyle(i, false)}
              >
                {/* Any photo opens that event's page, as on the reference site. */}
                <Link
                  href={`/events/${e.slug}`}
                  aria-label={`View ${e.name}`}
                  tabIndex={i === active ? 0 : -1}
                  className="group/card absolute inset-0 block overflow-hidden bg-panel outline-offset-4 focus-visible:outline-2 focus-visible:outline-gold"
                >
                  <Image
                    src={e.images[0]?.src ?? "/dummy/product-placeholder.png"}
                    alt={e.images[0]?.alt ?? e.name}
                    fill
                    sizes="(min-width: 1024px) 26vw, 60vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover/card:scale-[1.04]"
                  />
                  <span className="absolute right-3 bottom-3 bg-ink/80 px-2.5 py-1.5 text-[11px] tracking-wide text-paper opacity-0 transition-opacity duration-300 group-hover/card:opacity-100 group-focus-visible/card:opacity-100">
                    View event →
                  </span>
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Counter, bottom-left over the coming photos (difference blend shows them through it) */}
        <div className="pointer-events-none absolute bottom-[2.7vh] left-[13.75vw] z-30 mix-blend-difference">
          <span className="absolute top-1 left-0 text-[11px] text-paper/60">Event</span>
          <div className="ml-[5.75vw] grid">
            {events.map((e, i) => (
              <span
                key={e.id}
                aria-hidden
                className={`col-start-1 row-start-1 font-(family-name:--font-geist) text-[min(12.5vw,20vh)] leading-[0.85] tracking-[-0.04em] text-paper tabular-nums ${
                  i === active ? BLUR_IN : BLURRED
                }`}
              >
                {pad(i + 1)}
              </span>
            ))}
          </div>
          <span className="absolute top-1 left-[22.25vw] text-[11px] text-paper">/{pad(n)}</span>
        </div>

        {/* Right: event list, the active one level with the photo */}
        <div
          ref={listWrapRef}
          className="absolute inset-y-0 left-[80vw] z-10 w-62 -translate-x-1/2 overflow-hidden mask-[linear-gradient(to_bottom,transparent,black_18%,black_85%,transparent)]"
        >
          <ol ref={listRef} className="absolute inset-x-0 top-0 m-0 list-none p-0 will-change-transform">
            {events.map((e, i) => (
              <li
                key={e.id}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                aria-current={i === active ? "true" : undefined}
                className="flex min-h-[19.2vh] flex-col items-center justify-center py-3 text-center"
                style={{ opacity: i === 0 ? 1 : 0.2 }}
              >
                <p className="m-0 text-[11px] text-paper/52">
                  {e.year}
                  {e.category ? ` · ${e.category}` : ""}
                </p>
                <h2 className="m-0 mt-2 font-heading text-lg leading-tight font-medium text-paper uppercase">
                  <Link href={`/events/${e.slug}`} tabIndex={i === active ? 0 : -1} className="hover:text-gold">
                    {e.name}
                  </Link>
                </h2>
                <span className="mt-3 block h-px w-3 bg-paper/60" />
                <p className="m-0 mt-3 line-clamp-3 text-[11px] leading-[1.25] text-paper">{e.about}</p>
              </li>
            ))}
          </ol>
        </div>
        <div className="absolute top-1/2 right-5 z-20 -translate-y-1/2 [&_button]:size-3.75 [&>div]:gap-0.75">{pager}</div>
      </div>

      {/* Phones — huyml.co's mobile layout, measured off its page at 390×664 and 320×568:
          counter fixed 134px from the top, text + pager anchored to the bottom, the photo
          centred in the gap between them. */}
      <div className="absolute inset-0 flex flex-col px-5 pt-[134px] pb-6 lg:hidden">
        <div className="relative z-20 grid">
          {events.map((e, i) => (
            <div key={e.id} aria-hidden className={`relative col-start-1 row-start-1 ${i === active ? BLUR_IN : BLURRED}`}>
              <span className="font-(family-name:--font-geist) text-[90px] leading-[0.85] tracking-[-0.04em] text-paper tabular-nums">
                {pad(i + 1)}
              </span>
              <span className="absolute top-0.5 left-[114px] text-xs font-medium text-paper">/{pad(n)}</span>
            </div>
          ))}
        </div>

        {/* Photo stage */}
        {/* Sized against the gap it sits in (container units), so a long name that wraps to
            three lines on a small phone shrinks the photo instead of overlapping the text. */}
        <div className="relative z-30 my-4 min-h-0 flex-1 [container-type:size]">
          <div className="absolute top-1/2 left-1/2 aspect-3/2 w-[min(66vw,22rem,150cqh)] -translate-x-1/2 -translate-y-1/2">
            {events.map((e, i) => (
              <div
                key={e.id}
                ref={(el) => {
                  mCardRefs.current[i] = el;
                }}
                className="absolute inset-0 will-change-transform"
                style={mobileCardStyle(i, false)}
              >
                <Link
                  href={`/events/${e.slug}`}
                  aria-label={`View ${e.name}`}
                  tabIndex={i === active ? 0 : -1}
                  className="absolute inset-0 block overflow-hidden bg-panel shadow-[0_24px_48px_-16px_rgba(0,0,0,0.9)]"
                >
                  <Image
                    src={e.images[0]?.src ?? "/dummy/product-placeholder.png"}
                    alt={e.images[0]?.alt ?? e.name}
                    fill
                    priority={i < 2}
                    sizes="(min-width: 1024px) 24rem, 60vw"
                    className="object-cover"
                  />
                </Link>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-20 grid shrink-0">
          {events.map((e, i) => (
            <div
              key={e.id}
              aria-hidden={i !== active}
              className={`col-start-1 row-start-1 flex flex-col items-center text-center ${i === active ? BLUR_IN : `pointer-events-none ${BLURRED}`}`}
            >
              <p className="m-0 text-xs leading-[1.3] font-medium text-paper/52">
                {e.year}
                {e.category ? ` · ${e.category}` : ""}
              </p>
              <h2 className="m-0 mt-2 font-heading text-[clamp(1.25rem,6.2vw,1.5rem)] leading-none font-medium tracking-[0.01em] text-balance text-paper uppercase">
                <Link href={`/events/${e.slug}`} tabIndex={i === active ? 0 : -1}>
                  {e.name}
                </Link>
              </h2>
              <span className="mt-4 block h-px w-3 bg-paper/30" />
              <p className="m-0 mt-4 line-clamp-3 max-w-75 text-xs leading-[1.3] font-medium text-paper">{e.about}</p>
            </div>
          ))}
        </div>

        {/* Pager — where the reference has its colour swatches */}
        <div className="relative z-20 mt-5.5 flex shrink-0 justify-center [&_button]:size-3.75 [&>div]:gap-0.75">{pager}</div>
      </div>
      <p className="sr-only" aria-live="polite">
        {current ? `${current.name}, ${current.year}` : ""}
      </p>
    </section>
  );
}
