"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Crop of an over-sized photo inside its frame, as % of the frame — traced off the design
// where the photo isn't simply centre-cropped.
type Crop = { width: number; height: number; left: number; top: number };
type Photo = { src: string; alt: string; w: number; h: number; rounded?: boolean; crop?: Crop };

// Each milestone's belt segment is a narrow strip centred in a transparent image (159×282 art,
// drawn 207px wide to thicken the strip); stacked row on row they read as one belt going white → black.
const MILESTONES: { year: string; title: string; body: string; belt: string; photos: Photo[] }[] = [
  {
    year: "1975",
    title: "Humble Beginnings",
    body: "The company, with its roots in the garment industry, was established to offer high-quality karate gi at affordable prices. It began as a small-scale business.",
    belt: "/about/timeline/belt-1975.png",
    photos: [
      {
        src: "/about/timeline/photo-1975.png",
        alt: "Gokaido's founders and first shop, 1975",
        w: 315,
        h: 212,
        crop: { width: 106.35, height: 105.35, left: -3.51, top: -2.41 },
      },
    ],
  },
  {
    year: "1990",
    title: "Manufacturing & Expansion",
    body: "The company started equipment manufacturing & steadily increased production & quality. Unique traditional marketing strategies were used to attract customers. Showroom inaugurated by Mumbai Police commissioner Arvind Inamdar & Actor Mukesh Khanna.",
    belt: "/about/timeline/belt-1990.png",
    photos: [{ src: "/about/timeline/photo-1990.png", alt: "Gokaido showroom, 1990", w: 367, h: 289, rounded: true }],
  },
  {
    year: "2003",
    title: "National Expansion",
    body: "Participated in the AIKF National Tournament & expanded its reach nationwide.",
    belt: "/about/timeline/belt-2003.png",
    photos: [{ src: "/about/timeline/photo-2003.png", alt: "Gokaido at the AIKF National Tournament", w: 332, h: 289, rounded: true }],
  },
  {
    year: "2005",
    title: "Product Innovation",
    body: "Expanded operations by establishing a new outlet and utilized innovative methods to develop new products.",
    belt: "/about/timeline/belt-2005.png",
    photos: [{ src: "/about/timeline/photo-2005.png", alt: "Gokaido's new outlet and production floor", w: 333, h: 289, rounded: true }],
  },
  {
    year: "2014",
    title: "Approval & Expansion",
    body: "The company received approval from the Karate Federation of India and launched a franchise model across India, offering a wide range of products.",
    belt: "/about/timeline/belt-2014.png",
    photos: [
      {
        src: "/about/timeline/photo-2014.png",
        alt: "Gokaido receiving Karate Federation of India approval",
        w: 327,
        h: 289,
        rounded: true,
        crop: { width: 99.37, height: 131.16, left: 0.49, top: -15.66 },
      },
    ],
  },
  {
    year: "2017",
    title: "Expansion & Innovation",
    body: "Expanded operations by establishing a new outlet and utilized innovative methods to develop customer centric products.",
    belt: "/about/timeline/belt-2017.png",
    photos: [{ src: "/about/timeline/photo-2017.png", alt: "Gokaido outlet and championship events", w: 339, h: 289, rounded: true }],
  },
  {
    year: "2022",
    title: "Flagship Showroom",
    body: "Re-established flagship showroom in Mumbai. Improved product display & walk-in experience.",
    belt: "/about/timeline/belt-2022.png",
    photos: [{ src: "/about/timeline/photo-2022.png", alt: "Gokaido flagship showroom in Mumbai", w: 327, h: 289, rounded: true }],
  },
  {
    year: "2025",
    title: "Expansion & Digital Growth",
    body: "Opening of new franchise outlets in Panvel, Kolkata, and Raipur. Initiated Gokaido App. Set up a dedicated backend office.",
    belt: "/about/timeline/belt-2025.png",
    // One collage photo split across two panels.
    photos: [
      {
        src: "/about/timeline/photo-2025.png",
        alt: "Gokaido team at a new franchise outlet",
        w: 255,
        h: 289,
        rounded: true,
        crop: { width: 234.05, height: 122.78, left: -0.13, top: -11.49 },
      },
      {
        src: "/about/timeline/photo-2025.png",
        alt: "Gokaido franchise storefront",
        w: 262,
        h: 289,
        rounded: true,
        crop: { width: 184.86, height: 99.84, left: -85.26, top: 0 },
      },
    ],
  },
];

function PhotoFrame({ photo }: { photo: Photo }) {
  const { crop } = photo;
  return (
    <div
      className={`relative min-w-0 overflow-hidden ${photo.rounded ? "rounded-[13px]" : ""}`}
      style={{ width: photo.w, aspectRatio: `${photo.w} / ${photo.h}` }}
    >
      <div
        className="absolute inset-0"
        style={crop ? { width: `${crop.width}%`, height: `${crop.height}%`, left: `${crop.left}%`, top: `${crop.top}%` } : undefined}
      >
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          sizes={crop ? `${Math.round((photo.w * crop.width) / 100)}px` : `${photo.w}px`}
          className={crop ? "" : "object-cover"}
        />
      </div>
    </div>
  );
}

/**
 * "Our journey" timeline: milestones alternate either side of a karate belt that runs
 * white → black down the middle (on mobile the belt runs down the left edge). Each belt
 * segment grows in as its row scrolls into view, and the row's text and photo fade in
 * from their side.
 */
export default function JourneyTimeline() {
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-milestone]", list).forEach((row) => {
        gsap.fromTo(
          row.querySelector("[data-belt]"),
          { clipPath: "inset(0 0 100% 0)" },
          {
            clipPath: "inset(0 0 0% 0)",
            ease: "none",
            scrollTrigger: { trigger: row, start: "top 75%", end: "bottom 75%", scrub: true },
          },
        );
        row.querySelectorAll<HTMLElement>("[data-side]").forEach((el) => {
          const fromLeft = el.dataset.side === "left" && window.matchMedia("(min-width: 64rem)").matches;
          gsap.from(el, {
            opacity: 0,
            x: fromLeft ? -40 : 40,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: { trigger: row, start: "top 70%", once: true },
          });
        });
      });
    }, list);
    return () => ctx.revert();
  }, []);

  return (
    <section id="journey" aria-label="Our journey" className="mx-auto max-w-360 px-4 pb-16 sm:px-15 sm:pb-24 lg:px-20 mt-30">
      <ol ref={listRef} className="m-0 list-none p-0">
        {MILESTONES.map((m, i) => {
          // Rows alternate: photo left / text right, then text left / photo right.
          const photoLeft = i % 2 === 0;
          return (
            <li
              key={m.year}
              data-milestone
              className="grid grid-cols-[30px_minmax(0,1fr)] gap-x-5 gap-y-5 lg:h-[278px] lg:grid-cols-[minmax(0,1fr)_159px_minmax(0,1fr)] lg:items-center lg:gap-x-16 lg:gap-y-0 xl:gap-x-28 2xl:gap-x-[195px]"
            >
              <div
                aria-hidden
                data-belt
                className="relative row-span-2 self-stretch lg:col-start-2 lg:row-span-1 lg:row-start-1 lg:h-[282px] lg:self-center"
              >
                {/* Stretched to a fixed box rather than cover-scaled, so the strip stays the same
                    thickness on every row (mobile rows are taller than the 282px art). The image is
                    wider than this column, but only its transparent margin falls outside. */}
                <div className="absolute inset-y-0 left-1/2 w-[207px] -translate-x-1/2">
                  <Image src={m.belt} alt="" fill sizes="207px" className="object-fill" />
                </div>
              </div>

              <div
                data-side={photoLeft ? "right" : "left"}
                className={`flex w-full max-w-[348px] flex-col gap-2 pt-10 lg:row-start-1 lg:pt-0 ${
                  photoLeft ? "lg:col-start-3" : "lg:col-start-1 lg:justify-self-end"
                }`}
              >
                <div className="flex flex-col gap-1 font-heading font-bold">
                  <span className="text-[13px] text-red">{m.year}</span>
                  <h3 className="m-0 text-2xl leading-tight text-paper uppercase sm:text-[25.5px]">{m.title}</h3>
                </div>
                <p className="m-0 font-sans text-[13px] leading-normal text-paper/70">{m.body}</p>
              </div>

              <div
                data-side={photoLeft ? "left" : "right"}
                className={`flex min-w-0 gap-1.5 pb-10 lg:row-start-1 lg:pb-0 ${
                  photoLeft ? "lg:col-start-1 lg:justify-self-end" : "lg:col-start-3"
                }`}
              >
                {m.photos.map((p, j) => (
                  <PhotoFrame key={j} photo={p} />
                ))}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
