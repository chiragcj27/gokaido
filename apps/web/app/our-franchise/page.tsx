import type { Metadata } from "next";
import Image from "next/image";
import ReelShowcase from "../components/ReelShowcase/ReelShowcase";
import { DUMMY_REELS, getReels } from "../lib/reels";
import FranchiseSignup from "./FranchiseSignup";
import WhyWhatWho from "./WhyWhatWho";

export const metadata: Metadata = {
  title: "Our Franchise",
};

// Collage geometry, traced off the design at 1160px wide: every value is a % of the
// collage box (1160×540), so the whole arrangement scales down intact on phones.
const PHOTOS = [
  { src: "/franchise/office.png", alt: "Gokaido Sports head office reception", w: 529, h: 549, left: 2.6, top: 2.8, width: 31.5 },
  { src: "/franchise/boardroom.png", alt: "Gokaido head office meeting room", w: 572, h: 572, left: 31.5, top: 9.3, width: 35.8 },
  { src: "/franchise/storefront.png", alt: "Gokaido martial arts store front", w: 525, h: 525, left: 64, top: 28.7, width: 32.8 },
];

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

export default async function OurFranchisePage() {
  const reels = await getReels();

  return (
    <>
    <main className="overflow-hidden px-4 pt-16 pb-24 sm:px-15 sm:pt-20 lg:px-20">
      <section className="relative mx-auto max-w-290">
        <h1 className="relative z-10 m-0 mx-auto max-w-[14ch] text-center font-heading text-[clamp(1.75rem,5vw,3.5rem)] leading-tight font-normal text-paper">
          Bring Gokaido to your city/country
        </h1>

        <div className="relative mt-[8%] aspect-1160/540">
          <svg
            aria-hidden
            viewBox="0 0 1160 540"
            overflow="visible"
            className="pointer-events-none absolute inset-0 h-full w-full text-paper/25"
          >
            {RAYS.map((r, i) => (
              <line key={i} x1={r.from.x} y1={r.from.y} x2={r.to.x} y2={r.to.y} stroke="currentColor" strokeWidth={1.5} />
            ))}
          </svg>

          <div className="absolute top-0 left-[16.4%] h-[95.4%] w-[66.5%] bg-black" />

          {PHOTOS.map((p) => (
            <Image
              key={p.src}
              src={p.src}
              alt={p.alt}
              width={p.w}
              height={p.h}
              sizes="(min-width: 1160px) 420px, 36vw"
              className="absolute h-auto object-contain"
              style={{ left: `${p.left}%`, top: `${p.top}%`, width: `${p.width}%` }}
            />
          ))}
        </div>
      </section>

      {/* Placeholder copy (tracked in DUMMY_DATA.md) — swap for the client's franchise pitch. */}
      <section className="mx-auto mt-[20%] max-w-290">
        <p className="m-0 font-heading text-xl leading-snug font-normal text-paper/50 sm:text-3xl lg:text-5xl [&_em]:text-red [&_em]:not-italic">
          Since <em>1975</em>, <em>GOKAIDO</em> has equipped martial artists with gear built on discipline and trust.
          Now we&rsquo;re inviting passionate partners to bring that legacy to their own city or country. As a{" "}
          <em>GOKAIDO franchise</em>, you get a proven brand, our complete range of martial arts equipment, and
          hands-on support with store setup, training and marketing &mdash; everything you need to build a{" "}
          <em>thriving business</em> in your community.
        </p>
      </section>
    </main>
    <WhyWhatWho />
    <ReelShowcase reels={reels.length > 0 ? reels : DUMMY_REELS} />
    <FranchiseSignup />
    </>
  );
}
