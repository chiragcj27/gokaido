"use client";

import Image from "next/image";
import { useState } from "react";

const LETTER = {
  title: "A Heartfelt Thank You",
  body: [
    "When I look at Gokaido today, I feel proud of how far we have come. What started as a small dream in 1975 has become a family legacy that I am honoured to carry forward.",
    "Over the years, your trust, support, and love have given us the strength to keep growing.",
    "Every coach who trusted us, every athlete who wore our uniform, and every person who stood by us has become a part of our story.",
    "From my family to yours, thank you for being a part of the Gokaido journey. We have come a long way, but there is still so much more to achieve.",
  ],
  signOff: ["With heartfelt gratitude,", "The Gokaido Family"],
};

function Letter() {
  return (
    <>
      <p className="m-0">{LETTER.title}</p>
      <div className="my-[1.9em]">
        {LETTER.body.map((p) => (
          <p key={p} className="m-0">
            {p}
          </p>
        ))}
      </div>
      {LETTER.signOff.map((line) => (
        <p key={line} className="m-0">
          {line}
        </p>
      ))}
    </>
  );
}

/**
 * "Note from the founder": a card standing on the arena stage that flips over on tap
 * to reveal the thank-you letter, and flips back on a second tap. The letter is live
 * text sized off the card's width (cqw), so it keeps the design's proportions at any
 * size; where the minimum legible size no longer fits, the card grows taller instead.
 */
export default function FounderNote() {
  const [open, setOpen] = useState(false);

  return (
    <section className="relative isolate flex flex-col items-center overflow-hidden px-4 py-14 lg:px-0 lg:pt-[6%] lg:pb-[3%] xl:aspect-1600/760">
      <Image src="/about/ty_bg.png" alt="" fill sizes="100vw" className="-z-10 object-cover" />

      <h2 className="m-0 text-center font-sans text-[1.5rem] leading-tight lg:text-[clamp(2.25rem,3vw,3rem)] font-bold text-red uppercase">
        Note from the Founder
      </h2>

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-pressed={open}
        aria-label={open ? "Close the founder's note" : "Open the founder's note"}
        className="@container mt-8 w-full max-w-xl cursor-pointer border-0 bg-transparent p-0 text-left perspective-[2000px] lg:mt-[3.2%] lg:w-[60%] lg:max-w-none"
      >
        {/* Both faces share one grid cell, so the card is as tall as the aspect ratio or the
            letter needs, whichever is more. */}
        <div
          className={`grid aspect-square shadow-[0_20px_50px_rgb(0_0_0/0.6)] transition-transform duration-700 ease-[cubic-bezier(0.4,0.2,0.2,1)] transform-3d motion-reduce:duration-0 sm:aspect-1632/874 ${
            open ? "rotate-y-180" : ""
          }`}
        >
          {/* On phones the letter can make the card taller than it is wide, and cover-scaling
              would then crop the wordmark (it spans the middle 45% of the art). So there the
              art is sized off the card's width instead — wordmark ≈ 90% of it — and any extra
              height fades into the card's own dark tone. */}
          <div className="relative overflow-hidden bg-linear-to-b from-[#191919] to-[#0f0f0f] backface-hidden [grid-area:1/1]">
            <div className="absolute inset-0 max-sm:inset-auto max-sm:top-1/2 max-sm:left-1/2 max-sm:aspect-1632/874 max-sm:w-[200%] max-sm:-translate-x-1/2 max-sm:-translate-y-1/2 max-sm:[mask-image:linear-gradient(transparent,#000_10%,#000_90%,transparent)]">
              <Image
                src="/about/founder-note-front.jpg"
                alt=""
                fill
                sizes="(min-width: 1024px) 60vw, (min-width: 640px) 576px, 200vw"
                className="object-cover"
              />
            </div>
          </div>
          <div
            aria-hidden
            className="relative flex rotate-y-180 flex-col justify-center px-[8%] py-[10%] text-center font-sans text-[clamp(14px,1.75cqw,24px)] leading-[1.75] font-medium text-paper backface-hidden [grid-area:1/1] sm:px-[14%] sm:py-[4%]"
          >
            <Image
              src="/about/founder-note-letter-bg.jpg"
              alt=""
              fill
              sizes="(min-width: 1024px) 60vw, 576px"
              className="-z-10 object-cover"
            />
            <Letter />
          </div>
        </div>
      </button>

      {/* The card's letter is aria-hidden inside the button; this is the readable copy. */}
      <div className="sr-only">
        <Letter />
      </div>
    </section>
  );
}
