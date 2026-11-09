import Image from "next/image";
import Link from "next/link";

/**
 * "Want Gokaido on your shelves?" banner over the gear photo, with a faint red
 * sunburst behind the heading. The button opens the distributor sign-up page.
 */
export default function DistributorCta() {
  return (
    <section
      aria-labelledby="distributor-cta-title"
      data-snap-section
      className="relative mt-[clamp(5rem,13vw,12.5rem)] flex min-h-svh snap-start items-center justify-center overflow-hidden px-4 py-12"
    >
      <Image
        src="/our-franchise/cta-bg.png"
        alt=""
        fill
        // The photo covers a full-viewport section, so on anything narrower than
        // its own ratio (1808/870 ≈ 2.08) its width follows the viewport height.
        sizes="max(100vw, 208vh)"
        className="object-cover object-left lg:object-center"
      />
      <div aria-hidden className="absolute inset-0 bg-black/20" />
      {/* Mobile crop puts white gi behind the text; this band keeps it legible
          while leaving the headgear above and the gi logo below clear. */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-1/2 h-1/2 -translate-y-1/2 bg-linear-to-b from-transparent via-black/75 to-transparent lg:hidden"
      />
      {/* Sunburst centred 32% down the banner, as in the design; on mobile it
          sits behind the vertically centred heading. */}
      {/* eslint-disable-next-line @next/next/no-img-element -- static decorative SVG */}
      <img
        src="/our-franchise/cta-rays.svg"
        alt=""
        aria-hidden
        width={576}
        height={576}
        className="pointer-events-none absolute top-1/2 left-1/2 w-[90%] max-w-none lg:top-[32%] lg:w-[37.5%] -translate-x-1/2 -translate-y-1/2 rotate-[133.09deg]"
      />

      <div className="relative flex flex-col items-center gap-[clamp(1.5rem,4.5vw,4.3rem)] pt-[3%]">
        <h2
          id="distributor-cta-title"
          className="m-0 max-w-[min(73.4vw,1128px)] text-center font-heading text-[clamp(2.25rem,6.94vw,6.667rem)] leading-[0.88] font-normal tracking-[-0.02em] text-white uppercase"
        >
          Want Gokaido on your shelves?
        </h2>
        <Link
          href="/become-a-distributor"
          className="rounded-[10px] border-[1.6px] border-[#c10e12] bg-[#c10e12] px-[clamp(1.25rem,2vw,1.9rem)] py-[clamp(0.75rem,1.07vw,1rem)] font-heading text-[clamp(1rem,1.7vw,1.625rem)] leading-normal tracking-[-0.02em] whitespace-nowrap text-white uppercase transition-colors hover:bg-transparent focus-visible:bg-transparent"
        >
          Become a distributor
        </Link>
      </div>
    </section>
  );
}
