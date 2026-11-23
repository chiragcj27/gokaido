"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { GokaidoEvent } from "../lib/events";

// Pinned "selected work" scroller, after huyml.co: the section pins for a screen of
// scroll per event, and one eased progress value (0 … n-1) drives everything — the 3D
// photo stack in the middle, the event list on the right, the counter and the meta.
// Transforms are written straight to the DOM each frame; React only re-renders when
// the active (nearest) event changes.

const SCROLL_PER_EVENT = 0.9; // viewport heights of scroll per event
const EASE = 0.1; // per-60fps-frame lerp toward the scroll position (lower = floatier)

const pad = (n: number) => String(n).padStart(2, "0");

// Photo card `d` steps from the active one (fractional mid-scroll): neighbours tilt
// away through the perspective like pages on a drum, the rest fade out.
function cardStyle(d: number, reduced: boolean): CSSProperties {
  const a = Math.abs(d);
  const opacity = a <= 1 ? 1 : Math.max(0, 1 - (a - 1) * 1.6);
  const zIndex = 100 - Math.round(a * 10);
  if (reduced) return { transform: `translate3d(0, ${d * 135}%, 0)`, opacity, zIndex };
  return {
    transform:
      `translate3d(${d * 6}%, ${d * 135}%, ${-a * 160}px) ` +
      `rotateX(${-d * 38}deg) rotateY(${d * 14}deg) rotateZ(${-d * 6}deg)`,
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

// Phones don't follow the finger: a small scroll commits to the next / previous event
// and the photos then travel on their own, on huyml's curve (fitted to its frames).
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

// Phone counter + text: the outgoing one vanishes at once (no transition on the way out),
// the incoming one fades in fast and sharpens slowly out of a heavy blur.
const BLUR_IN =
  "opacity-100 blur-none transition-[opacity,filter] duration-[300ms,950ms] ease-[cubic-bezier(0.2,0.6,0.3,1)]";
const BLURRED = "opacity-0 blur-[10px]";

// Extra photos of an event fan out up-and-right behind its cover.
const FAN = [
  "translate3d(9%, -5%, -40px) scale(0.95)",
  "translate3d(17%, -10%, -80px) scale(0.9)",
];

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

function MetaFields({ event }: { event: GokaidoEvent }) {
  const rows: [string, string | undefined][] = [
    ["Event place", event.place],
    ["Dates", event.dates],
    ["Sport", event.sport],
    ["Recognition", event.recognition],
    ["Hosted by", event.hostedBy],
  ];
  return (
    <dl className="m-0 grid grid-cols-[6.5rem_minmax(0,1fr)] gap-x-4 gap-y-4 lg:gap-y-6">
      {rows
        .filter(([, v]) => v)
        .map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-[11px] leading-snug text-paper/45">{label}</dt>
            <dd className="m-0 text-xs leading-snug text-paper">{value}</dd>
          </div>
        ))}
    </dl>
  );
}

function Counter({ active, total, className = "" }: { active: number; total: number; className?: string }) {
  return (
    <div className={`flex items-start gap-2 ${className}`}>
      {/* A column of every number, slid up 1em per step — leading-none makes each line exactly 1em. */}
      <div className="h-[1em] overflow-hidden font-heading leading-none font-light tabular-nums" aria-hidden>
        <div
          className="transition-transform duration-700 ease-[cubic-bezier(0.7,0,0.2,1)]"
          style={{ transform: `translateY(-${active}em)` }}
        >
          {Array.from({ length: total }, (_, i) => (
            <div key={i}>{pad(i + 1)}</div>
          ))}
        </div>
      </div>
      <span className="mt-[0.4em] text-xs text-paper/60">/{pad(total)}</span>
      <span className="sr-only">
        Event {active + 1} of {total}
      </span>
    </div>
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

    const phone = window.matchMedia("(max-width: 1023.98px)");
    let target = 0;
    let current = 0; // desktop: eased toward the scroll position every frame
    const m = { p: 0, idx: 0 }; // phones: committed event + its tweened visual position
    let lastActive = 0;
    let centers: number[] = [];
    let wrapH = 0;

    const measure = () => {
      centers = itemRefs.current.map((li) => (li ? li.offsetTop + li.offsetHeight / 2 : 0));
      wrapH = listWrapRef.current?.clientHeight ?? 0;
    };

    const setNearest = (p: number) => {
      const nearest = Math.round(p);
      if (nearest !== lastActive) {
        lastActive = nearest;
        setActive(nearest);
      }
    };

    const applyDesktop = (p: number) => {
      cardRefs.current.forEach((el, i) => {
        if (!el) return;
        const s = cardStyle(i - p, reduced);
        el.style.transform = String(s.transform);
        el.style.opacity = String(s.opacity);
        el.style.zIndex = String(s.zIndex);
      });

      // Keep the list's interpolated position centred in its column.
      const lo = Math.floor(p);
      const hi = Math.min(lo + 1, n - 1);
      const c = (centers[lo] ?? 0) + ((centers[hi] ?? 0) - (centers[lo] ?? 0)) * (p - lo);
      if (listRef.current) listRef.current.style.transform = `translate3d(0, ${wrapH / 2 - c}px, 0)`;
      itemRefs.current.forEach((li, i) => {
        if (li) li.style.opacity = String(Math.max(0.12, 1 - Math.abs(i - p) * 0.88));
      });
      if (!phone.matches) setNearest(p);
    };

    const applyMobile = () => {
      mCardRefs.current.forEach((el, i) => {
        if (!el) return;
        const s = mobileCardStyle(i - m.p, reduced);
        el.style.transform = String(s.transform);
        el.style.opacity = String(s.opacity);
        el.style.zIndex = String(s.zIndex);
        // Only the photo in the middle is tappable — the corner ones are decoration.
        el.style.pointerEvents = Math.abs(i - m.p) < 0.5 ? "auto" : "none";
      });
      // The text and counter swap at the midpoint, as on the reference.
      if (phone.matches) setNearest(m.p);
    };

    const apply = (p: number) => {
      applyDesktop(p);
      applyMobile();
    };

    // Phones: commit to an event once the scroll has moved a little past the current one
    // in the direction of travel, then tween there. Direction matters: right after a commit
    // the scroll is still short of the new event (the directional snap below brings it
    // along), which must not read as a step back.
    const commitMobile = (direction: number) => {
      let idx = m.idx;
      if (direction > 0 && target > m.idx + M_COMMIT) idx = Math.min(n - 1, Math.ceil(target - M_COMMIT));
      else if (direction < 0 && target < m.idx - M_COMMIT) idx = Math.max(0, Math.floor(target + M_COMMIT));
      if (idx === m.idx) return;
      goMobile(idx);
    };

    const goMobile = (idx: number) => {
      if (idx === m.idx) return;
      const steps = Math.abs(idx - m.idx);
      m.idx = idx;
      gsap.to(m, {
        p: idx,
        duration: reduced ? 0 : M_DURATION + 0.12 * (steps - 1),
        ease: M_EASE,
        overwrite: true,
        onUpdate: applyMobile,
      });
    };

    measure();
    apply(0);

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: () => `+=${(n - 1) * window.innerHeight * SCROLL_PER_EVENT}`,
      pin: true,
      invalidateOnRefresh: true,
      snap: {
        snapTo: 1 / (n - 1),
        directional: true, // a small scroll settles on the next event, not back — phones commit to it
        duration: { min: 0.25, max: 0.7 },
        delay: 0.08,
        ease: "power2.inOut",
        // Safety net: wherever the scroll finally settles is the event phones show.
        onComplete: () => goMobile(Math.round(target)),
      },
      onUpdate: (self) => {
        target = self.progress * (n - 1);
        commitMobile(self.direction);
      },
      onRefresh: measure,
    });
    triggerRef.current = trigger;

    // "← All events" on a detail page links to /events#{slug}: open at that event
    // instead of the top (instant jump, no animation through the ones before it).
    const fromHash = decodeURIComponent(window.location.hash.slice(1));
    const startAt = fromHash ? slugsRef.current.indexOf(fromHash) : -1;
    if (startAt > 0) {
      target = current = m.p = m.idx = startAt;
      apply(current);
      window.scrollTo({ top: trigger.start + (trigger.end - trigger.start) * (startAt / (n - 1)), behavior: "instant" });
    }

    const tick = () => {
      const diff = target - current;
      if (Math.abs(diff) < 0.0005) {
        if (current !== target) {
          current = target;
          applyDesktop(current);
        }
        return;
      }
      current = reduced ? target : current + diff * (1 - Math.pow(1 - EASE, gsap.ticker.deltaRatio()));
      applyDesktop(current);
    };
    gsap.ticker.add(tick);

    const ro = new ResizeObserver(() => {
      measure();
      apply(current);
    });
    if (listWrapRef.current) ro.observe(listWrapRef.current);

    // Crossing the breakpoint hands the active event to the other layout's progress.
    const onBreakpoint = () => setNearest(phone.matches ? m.p : current);
    phone.addEventListener("change", onBreakpoint);

    return () => {
      phone.removeEventListener("change", onBreakpoint);
      gsap.killTweensOf(m);
      gsap.ticker.remove(tick);
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
      <div className="relative mx-auto flex h-full max-w-384 flex-col px-4 pt-[calc(var(--navbar-h)+1.25rem)] pb-5 sm:px-8 lg:px-10 lg:pb-8">
        {/* Top strip */}
        <div className="relative z-30 hidden items-start justify-between gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,1fr)] lg:gap-10">
          <div className="hidden lg:block" />
          <div>
            <h1 className="m-0 font-heading text-[11px] font-semibold tracking-wide text-paper uppercase">
              Gokaido Events
            </h1>
            <p className="m-0 mt-0.5 text-[11px] text-paper/50">
              Mumbai{clock ? `, ${clock}` : ""}
            </p>
          </div>
          <p className="m-0 text-right text-[11px] text-paper/50">
            For enquiries
            <Link
              href="/contact-us"
              className="ml-3 text-paper underline underline-offset-4 hover:text-gold"
            >
              Contact us
            </Link>
          </p>
        </div>

        {/* Body */}
        <div className="relative hidden min-h-0 flex-1 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,1fr)] lg:gap-10">
          {/* Left: meta + counter (desktop) */}
          <div className="relative z-20 hidden min-h-0 flex-col lg:flex">
            <div className="relative mt-[18vh] min-h-56">
              {events.map((e, i) => (
                <div
                  key={e.id}
                  aria-hidden={i !== active}
                  className={`absolute inset-x-0 top-0 max-w-md transition-all duration-500 ease-out ${
                    i === active ? "translate-y-0 opacity-100 delay-150" : "pointer-events-none translate-y-3 opacity-0"
                  }`}
                >
                  <MetaFields event={e} />
                </div>
              ))}
            </div>
            <div className="mt-auto flex items-end justify-between gap-6">
              <span className="pb-2 text-[11px] text-paper/50">Scroll</span>
              <div className="flex flex-col">
                <span className="text-[11px] text-paper/45">Event</span>
                {/* Over-sized on purpose: it overlaps the photo stack, as in the design. */}
                <Counter active={active} total={n} className="mr-[-30%] text-[clamp(6rem,10.5vw,10.5rem)] text-paper" />
              </div>
            </div>
          </div>

          {/* Centre: 3D photo stack */}
          <div className="relative z-10 h-full perspective-[1400px]">
            <div className="absolute top-1/2 left-1/2 aspect-5/4 w-[min(100%,24rem,40svh)] -translate-x-1/2 -translate-y-1/2 transform-3d">
              {events.map((e, i) => (
                <div
                  key={e.id}
                  ref={(el) => {
                    cardRefs.current[i] = el;
                  }}
                  className="absolute inset-0 transform-3d will-change-transform"
                  style={cardStyle(i, false)}
                >
                  {e.images.slice(1, 3).map((img, k) => (
                    <div
                      key={img.src + k}
                      className="absolute inset-0 overflow-hidden bg-panel brightness-[0.55]"
                      style={{ transform: FAN[k], zIndex: -1 - k }}
                    >
                      <Image src={img.src} alt="" fill sizes="(min-width: 1024px) 24rem, 60vw" className="object-cover" />
                    </div>
                  ))}
                  {/* Any photo opens that event's page, as on the reference site. */}
                  <Link
                    href={`/events/${e.slug}`}
                    aria-label={`View ${e.name}`}
                    tabIndex={i === active ? 0 : -1}
                    className="group/card absolute inset-0 block overflow-hidden bg-panel shadow-[0_30px_60px_-20px_rgba(0,0,0,0.9)] outline-offset-4 focus-visible:outline-2 focus-visible:outline-gold"
                  >
                    <Image
                      src={e.images[0]?.src ?? "/dummy/product-placeholder.png"}
                      alt={e.images[0]?.alt ?? e.name}
                      fill
                      sizes="(min-width: 1024px) 24rem, 60vw"
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

          {/* Right: event list (desktop) */}
          <div className="relative z-20 hidden min-h-0 lg:block">
            <div
              ref={listWrapRef}
              className="absolute inset-0 right-16 overflow-hidden mask-[linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)]"
            >
              <ol ref={listRef} className="absolute inset-x-0 top-0 m-0 list-none p-0 will-change-transform">
                {events.map((e, i) => (
                  <li
                    key={e.id}
                    ref={(el) => {
                      itemRefs.current[i] = el;
                    }}
                    aria-current={i === active ? "true" : undefined}
                    className="mx-auto max-w-88 py-7 text-center"
                    style={{ opacity: i === 0 ? 1 : 0.12 }}
                  >
                    <p className="m-0 text-[11px] tracking-wide text-paper/70">
                      {e.year}{e.category ? ` · ${e.category}` : ""}
                    </p>
                    <h2 className="m-0 mt-2 font-heading text-xl leading-tight font-medium tracking-wide text-paper uppercase">
                      <Link href={`/events/${e.slug}`} tabIndex={i === active ? 0 : -1} className="hover:text-gold">
                        {e.name}
                      </Link>
                    </h2>
                    <span className="mx-auto mt-3 block h-px w-4 bg-paper/70" />
                    <p className="m-0 mt-3 text-xs leading-relaxed text-paper/80">{e.about}</p>
                  </li>
                ))}
              </ol>
            </div>
            <div className="absolute top-1/2 right-0 -translate-y-1/2">{pager}</div>
          </div>

        </div>
      </div>

      {/* Phones — after huyml.co's mobile view: big counter, one photo, the active event's
          text and the pager, everything else crossfading through a blur. */}
      <div className="absolute inset-0 flex flex-col px-5 pt-[calc(var(--navbar-h)+0.75rem)] pb-6 lg:hidden">
        <div className="relative z-20 grid">
          {events.map((e, i) => (
            <div
              key={e.id}
              aria-hidden
              className={`col-start-1 row-start-1 flex items-start gap-3 ${i === active ? BLUR_IN : BLURRED}`}
            >
              <span className="font-heading text-[clamp(4.5rem,24vw,7rem)] leading-[0.85] font-light tracking-tight text-paper tabular-nums">
                {pad(i + 1)}
              </span>
              <span className="mt-1 text-sm text-paper/70">/{pad(n)}</span>
            </div>
          ))}
        </div>

        {/* Photo stage */}
        <div className="relative z-30 min-h-0 flex-1">
          <div className="absolute top-1/2 left-1/2 aspect-3/2 w-[min(66vw,22rem,45svh)] -translate-x-1/2 -translate-y-1/2">
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
              className={`col-start-1 row-start-1 text-center ${i === active ? BLUR_IN : `pointer-events-none ${BLURRED}`}`}
            >
              <p className="m-0 text-xs text-paper/50">
                {e.year}
                {e.category ? ` · ${e.category}` : ""}
              </p>
              <h2 className="m-0 mt-2 font-heading text-[clamp(1.4rem,6.5vw,1.9rem)] leading-[1.05] font-medium tracking-tight text-balance text-paper uppercase">
                <Link href={`/events/${e.slug}`} tabIndex={i === active ? 0 : -1}>
                  {e.name}
                </Link>
              </h2>
              <span className="mx-auto mt-4 block h-px w-5 bg-paper/30" />
              <p className="m-0 mx-auto mt-4 line-clamp-3 max-w-80 text-[13px] leading-snug text-paper/80">{e.about}</p>
            </div>
          ))}
        </div>

        <div className="relative z-20 mt-6 flex shrink-0 justify-center">{pager}</div>
      </div>
      <p className="sr-only" aria-live="polite">
        {current ? `${current.name}, ${current.year}` : ""}
      </p>
    </section>
  );
}
