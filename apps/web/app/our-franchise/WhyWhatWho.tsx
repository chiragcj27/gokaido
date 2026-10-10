"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

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

// Placeholder copy (tracked in DUMMY_DATA.md) — swap for the client's franchise pitch.
// Card colours sampled from the design.
const ROWS: Row[] = [
  {
    question: "Why?",
    title: "Why buy Gokaido",
    color: "#b78f4d",
    tilt: -3,
    points: [
      { lead: "Trusted since 1975", rest: " — five decades of outfitting dojos and athletes" },
      { lead: "Built for the mat", rest: " — uniforms, belts and protection made to take real training" },
      { lead: "One complete range", rest: " — karate, boxing and taekwondo under one roof" },
      { lead: "A name people know", rest: " — students and coaches already ask for it" },
      { lead: "Repeat customers", rest: " — belts get earned, gear gets upgraded" },
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
      { rest: "Sports & fitness stores" },
      { rest: "Martial arts academies & dojos" },
      { rest: "Entrepreneurs entering sports retail" },
      { rest: "Distributors opening new cities & countries" },
      { rest: "School & university sports suppliers" },
      { rest: "Partners who refuse to sell average gear" },
    ],
  },
];

/**
 * Why / What / Who cards. On desktop the section pins and the rows stack in one
 * spot: scrolling slides each next row up from below to cover the previous one,
 * and when a row lands its contents reveal — the big question word pops up with a
 * tilt, the card scales in, then its title and list items fade in one by one.
 * On mobile the rows just flow and each one reveals as it scrolls into view.
 */
export default function WhyWhatWho() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    gsap.registerPlugin(ScrollTrigger);

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rows = gsap.utils.toArray<HTMLElement>("[data-row]", section);

    // Paused reveal timeline for one row's contents.
    const reveal = (row: HTMLElement, i: number) => {
      const tl = gsap.timeline({ paused: true });
      const question = row.querySelector("[data-question]");
      if (question) {
        tl.fromTo(
          question,
          { autoAlpha: 0, y: 80, scale: 0.6, rotation: ROWS[i].tilt * -2.5 },
          { autoAlpha: 1, y: 0, scale: 1, rotation: ROWS[i].tilt, duration: 0.9, ease: "back.out(1.6)" },
          0,
        );
      }
      tl.fromTo(row.querySelector("[data-card]"), { autoAlpha: 0, scale: 0.8 }, { autoAlpha: 1, scale: 1, duration: 0.7, ease: "power3.out" }, 0)
        .fromTo(row.querySelector("[data-title]"), { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out" }, 0.25)
        .fromTo(
          row.querySelectorAll("[data-item]"),
          { autoAlpha: 0, y: 12 },
          { autoAlpha: 1, y: 0, duration: 0.4, ease: "power2.out", stagger: 0.07 },
          0.4,
        );
      return tl;
    };

    if (reduceMotion) {
      rows.forEach((row, i) => gsap.set(row.querySelector("[data-question]"), { rotation: ROWS[i].tilt }));
      return;
    }

    const mm = gsap.matchMedia(section);

    mm.add("(min-width: 1024px)", () => {
      const reveals = rows.map(reveal);

      // First row reveals as the section comes into view.
      ScrollTrigger.create({
        trigger: section,
        start: "top 60%",
        onEnter: () => reveals[0].play(),
        onLeaveBack: () => reveals[0].reverse(),
      });

      const stack = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${window.innerHeight * (rows.length - 1)}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });
      rows.slice(1).forEach((row, j) => {
        const i = j + 1;
        // Reveal as the row starts sliding in, so it never arrives as an empty slab.
        // Fires both ways as the scrub crosses this point.
        stack.call(() => {
          if (stack.scrollTrigger?.direction === -1) reveals[i].reverse();
          else reveals[i].play();
        });
        stack.fromTo(row, { y: () => window.innerHeight }, { y: 0, ease: "none", duration: 1 });
      });
    });

    mm.add("(max-width: 1023px)", () => {
      rows.forEach((row, i) => {
        const tl = reveal(row, i);
        ScrollTrigger.create({
          trigger: row,
          start: "top 80%",
          onEnter: () => tl.play(),
          onLeaveBack: () => tl.reverse(),
        });
      });
    });

    return () => mm.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative flex flex-col px-4 pb-16 sm:px-15 lg:grid lg:pb-0 lg:h-screen lg:content-center lg:justify-items-center lg:overflow-hidden lg:px-20"
    >
      {ROWS.map((row, i) => (
        <div
          key={row.question}
          data-row
          className="flex w-full max-w-360 flex-col gap-2.5 border-b border-dashed border-paper/30 bg-ink py-2.5 first:border-t lg:[grid-area:1/1] lg:grid lg:grid-cols-2 lg:border-t"
          style={{ zIndex: i }}
        >
          <div className={`hidden items-center justify-center text-center lg:flex ${i % 2 ? "lg:order-2" : ""}`}>
            <h2
              data-question
              className="m-0 font-heading text-[11.25rem] leading-none font-light text-paper uppercase"
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
            <h3 data-title className="m-0 max-w-[12ch] font-heading text-5xl leading-none font-light uppercase lg:text-[5rem]">
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
  );
}
