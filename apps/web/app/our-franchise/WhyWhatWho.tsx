"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

interface Point {
  lead?: string;
  rest: string;
}

interface Row {
  question: string;
  title: string;
  color: string;
  tilt: number; // resting rotation of the big question word, degrees
  points: Point[];
}

// Why/Who copy is from the design; the What card is still our placeholder (tracked in
// DUMMY_DATA.md) — the design's own What copy is unrelated template text.
// Card colours sampled from the design.
const ROWS: Row[] = [
  {
    question: "Why?",
    title: "Gokaido",
    color: "#b78f4d",
    tilt: -3,
    points: [
      { lead: "50+ years of expertise", rest: " — Five decades of manufacturing and supplying martial arts uniforms and equipment, since 1975." },
      { lead: "A name that stands for quality", rest: " — An established Indian martial arts brand trusted by practitioners, coaches, and institutions." },
      { lead: "More than just uniforms", rest: " — A comprehensive range of martial arts uniforms, protective equipment, and accessories under one roof." },
      { lead: "A model that works", rest: " — 20+ locations and counting. Step into a business model that's already been put to the test." },
      { lead: "A market with purpose", rest: " — Serve a growing ecosystem of martial arts academies, coaches, athletes, and institutions." },
      { lead: "Built on product knowledge", rest: " — Industry experience that helps you understand what your customers need, not just what they buy." },
    ],
  },
  {
    question: "What?",
    title: "What our partners get",
    color: "#224399",
    tilt: 3,
    points: [
      { lead: "Franchise pricing", rest: " — room to win on every sale" },
      { lead: "Store setup support", rest: " — layout, branding and signage done with you" },
      { lead: "Easy ordering", rest: " — restocking without jumping through hoops" },
      { lead: "Fast dispatch", rest: " — stock on your shelves before the next grading" },
      { lead: "Marketing support", rest: " — launch campaigns and local promotions" },
      { lead: "Product training", rest: ": your team will know a gi from a dobok" },
    ],
  },
  {
    question: "Who?",
    title: "Who Gokaido works for",
    color: "#c83632",
    tilt: -3,
    points: [
      { lead: "Martial arts practitioners & coaches", rest: " — Ready to turn their industry knowledge and connections into a business." },
      { lead: "Sports goods retailers", rest: " — Looking to expand their product offering with a specialised martial arts brand." },
      { lead: "Sports entrepreneurs", rest: " — Interested in building a focused retail business in the sports industry." },
      { lead: "Existing business owners", rest: " — Looking to diversify into martial arts uniforms and equipment." },
      { lead: "Local business leaders", rest: " — With a strong understanding of their market and the drive to build lasting customer relationships." },
      { lead: "Growth-minded entrepreneurs", rest: ": People ready to represent an established Indian brand and grow with it." },
    ],
  },
];

// Desktop stack geometry: each arriving row stops PEEK px lower than the one before,
// while the rows already there are pushed up another LIFT px, so they fan out above it.
const PEEK = 64;
const LIFT = 115.2;

/**
 * Why / What / Who cards. On desktop the section pins and the rows stack like a deck:
 * scrolling slides each next row up over the previous ones, which get nudged up so
 * their tops stay peeking out. Each row reveals once, as soon as 15% of it is on
 * screen — the big question word springs up from a random tilt, the card scales in,
 * its title pops in letter by letter, then the list items rise in one after another.
 * On mobile the rows just flow, with the same reveal.
 */
export default function WhyWhatWho() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger, SplitText);

    const rows = gsap.utils.toArray<HTMLElement>("[data-row]", section);
    const observers: IntersectionObserver[] = [];

    const ctx = gsap.context(() => {
      rows.forEach((row, i) => {
        const question = row.querySelector("[data-question]");
        const card = row.querySelector("[data-card]");
        const title = row.querySelector<HTMLElement>("[data-title]");
        const items = row.querySelectorAll("[data-item]");
        const chars = title ? SplitText.create(title, { type: "words,chars" }).chars : [];

        if (question) gsap.set(question, { autoAlpha: 0, y: 80, scale: 0.6, rotation: "random(-20, 20)" });
        gsap.set(card, { autoAlpha: 0, scale: 0.8 });
        gsap.set(chars, { opacity: 0, y: 60, scaleX: 0.8, scaleY: 0.5 });
        gsap.set(items, { autoAlpha: 0, yPercent: 50 });

        // IntersectionObserver rather than ScrollTrigger: it sees the rows' live,
        // transformed positions while the desktop stack is being scrubbed.
        const io = new IntersectionObserver(
          ([entry]) => {
            if (!entry.isIntersecting) return;
            io.disconnect();
            ctx.add(() => {
              const tl = gsap.timeline();
              if (question) {
                tl.to(question, { autoAlpha: 1, y: 0, scale: 1, rotation: ROWS[i].tilt, duration: 0.8, ease: "back.out(2.5)" }, 0);
              }
              tl.to(card, { autoAlpha: 1, scale: 1, duration: 0.7, ease: "power4.out" }, 0)
                .to(chars, { opacity: 1, y: 0, scaleX: 1, scaleY: 1, duration: 0.48, stagger: 0.028, ease: "back.out(1.7)" }, ">-0.35")
                .to(items, { autoAlpha: 1, yPercent: 0, duration: 0.8, stagger: 0.12, ease: "power3.out" }, ">-0.3");
            });
          },
          { threshold: 0.15 },
        );
        io.observe(row);
        observers.push(io);
      });

      gsap.matchMedia().add("(min-width: 1024px)", () => {
        if (rows.length < 2) return;
        const stack = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: `top-=${PEEK}px top`,
            end: () => `+=${(rows.length - 1) * rows[0].offsetHeight}`,
            pin: true,
            scrub: true,
            invalidateOnRefresh: true,
          },
        });
        for (let i = 1; i < rows.length; i++) {
          stack
            .to(rows.slice(i), { y: () => -rows[i].offsetTop + PEEK * i, ease: "none", duration: 1 })
            .to(rows.slice(0, i), { y: `-=${LIFT}`, ease: "none", duration: 1 }, "<");
        }
      });
    }, section);

    return () => {
      observers.forEach((io) => io.disconnect());
      ctx.revert();
    };
  }, []);

  // The outer div is React's stable handle: ScrollTrigger's pin wraps the <section> in a
  // pin-spacer, and the pin is only reverted in effect cleanup — after React has already
  // detached the DOM on navigation. Without this wrapper React would call removeChild on
  // the moved <section> and crash ("The node to be removed is not a child of this node").
  return (
    // -mb-40: the stack settles well short of the pinned screen's bottom, so the next section tucks up into that gap.
    <div className="lg:-mb-40">
    <section
      ref={sectionRef}
      className="relative flex flex-col px-2.5 pb-16 lg:h-screen lg:min-h-220 lg:pb-0"
    >
      {ROWS.map((row, i) => (
        <div
          key={row.question}
          data-row
          className="flex w-full flex-col gap-2.5 border-b border-dashed border-paper/30 bg-ink py-2.5 first:border-t will-change-transform lg:grid lg:grid-cols-2"
          style={{ zIndex: i }}
        >
          <div className={`hidden items-center justify-center text-center lg:flex ${i % 2 ? "lg:order-2" : ""}`}>
            <h2
              data-question
              className="m-0 font-heading text-[10rem] leading-none font-extrabold tracking-tight text-paper uppercase"
              style={{ transform: `rotate(${row.tilt}deg)` }}
            >
              {row.question}
            </h2>
          </div>

          <div
            data-card
            className="flex min-h-110 flex-col justify-between gap-10 rounded-xl p-5 text-paper lg:min-h-120 lg:p-10"
            style={{ backgroundColor: row.color }}
          >
            <h3 data-title className="m-0 max-w-[12ch] font-heading text-5xl leading-[0.95] font-extrabold tracking-tight uppercase lg:text-[4.5rem]">
              {row.title}
            </h3>
            <ul className="m-0 flex w-full list-none flex-col p-0">
              {row.points.map((p) => (
                <li
                  key={p.lead ?? p.rest}
                  data-item
                  className="flex w-full gap-5 border-b border-dashed border-paper/30 py-1.5 font-sans text-base first:border-t lg:text-lg"
                >
                  <svg aria-hidden viewBox="0 0 16 16" className="mt-1 h-4 w-4 shrink-0 text-paper/70">
                    <path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth={1.5} />
                  </svg>
                  <span>
                    {p.lead && <strong className="font-bold">{p.lead}</strong>}
                    {p.rest}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </section>
    </div>
  );
}
