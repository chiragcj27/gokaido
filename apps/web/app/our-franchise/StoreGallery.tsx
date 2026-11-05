import Image from "next/image";
import type { Store } from "../lib/stores";

// Card heights from the design (all 469 wide), repeated along the strip so
// the tops line up and the bottoms stagger.
const HEIGHTS = [497, 465, 408, 465, 497, 497, 465];
const CARD_WIDTH = 469;
// Enough cards that one copy of the strip is wider than any screen.
const MIN_CARDS = 7;

const FALLBACK = { src: "/our-franchise/store-interior.png", alt: "Inside a Gokaido store" };

/**
 * Endless strip of store photos that drifts left (pauses on hover, sits still
 * with reduced motion). Uses each store's photo from Admin → Stores; until any
 * store has one, the design's store-interior photo fills the strip.
 */
export default function StoreGallery({ stores }: { stores: Store[] }) {
  const photos = stores
    .filter((s) => s.image)
    .map((s) => ({ src: s.image!, alt: `Gokaido store, ${s.city}` }));
  const source = photos.length > 0 ? photos : [FALLBACK];
  const cards = Array.from({ length: Math.max(MIN_CARDS, source.length) }, (_, i) => source[i % source.length]);

  // Two identical copies: the track slides by exactly one copy's width (-50%), then loops seamlessly.
  // Spacing is a right margin on every card (not flex gap) so -50% lands exactly on the second copy.
  const strip = (copy: number) =>
    cards.map((photo, i) => (
      <li
        key={`${copy}-${i}`}
        aria-hidden={copy > 0 || undefined}
        className="relative mr-2.5 w-[max(13.75rem,min(30.5vw,469px))] shrink-0 overflow-hidden rounded-[10px] border-[0.8px] border-[#c10e12]"
        style={{ aspectRatio: `${CARD_WIDTH} / ${HEIGHTS[i % HEIGHTS.length]}` }}
      >
        <Image
          src={photo.src}
          alt={copy > 0 ? "" : photo.alt}
          fill
          sizes="(min-width: 1536px) 469px, max(220px, 30.5vw)"
          className="object-cover"
        />
      </li>
    ));

  return (
    <section aria-label="Our stores" className="overflow-hidden pt-7">
      <ul className="animate-store-marquee m-0 flex w-max list-none items-start p-0 hover:[animation-play-state:paused]">
        {strip(0)}
        {strip(1)}
      </ul>
    </section>
  );
}
