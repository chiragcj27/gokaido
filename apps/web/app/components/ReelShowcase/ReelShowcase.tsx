"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import type { Reel } from "../../lib/reels";

export interface ReelShowcaseProps {
  title?: string;
  reels: Reel[];
}

// Cards sit on one row at multiples of STEP (× card width), scaled down when
// they aren't the centre one. The numbers come from the design: side cards are
// ~83% of the centre card and sit ~30px clear of it.
const STEP = 0.99;
const SIDE_SCALE = 0.83;

/** Instagram's iframe embed URL for a reel/post permalink, or null if it isn't one. */
function instagramEmbedUrl(url: string | null) {
  const m = url?.match(/instagram\.com\/(reel|reels|p|tv)\/([\w-]+)/);
  return m ? `https://www.instagram.com/${m[1] === "reels" ? "reel" : m[1]}/${m[2]}/embed/` : null;
}

function formatInr(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

/** Signed shortest distance from `active` to `index` on a ring of `n` items. */
function ringOffset(index: number, active: number, n: number) {
  let d = index - active;
  if (d > n / 2) d -= n;
  else if (d < -n / 2) d += n;
  return d;
}

function ReelCard({ reel, offset, onSelect }: { reel: Reel; offset: number; onSelect: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const active = offset === 0;
  const near = Math.abs(offset) <= 1;

  // Only the centre card plays; the rest hold on their poster / first frame.
  // Reduced-motion visitors get the still frame and can press play themselves.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (active && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [active]);

  // A card that slides out of the centre goes back to silent, so it doesn't
  // come back unmuted the next time round.
  useEffect(() => {
    if (!active) setMuted(true);
  }, [active]);

  const clamped = Math.max(-2, Math.min(2, offset));
  const product = reel.product;
  const embedUrl = instagramEmbedUrl(reel.instagramUrl);

  return (
    <div
      onClick={active ? undefined : onSelect}
      className={`absolute left-1/2 top-1/2 w-(--reel-w) aspect-[9/13] overflow-hidden rounded-[10px] bg-panel transition-[transform,opacity] duration-500 ease-out ${
        near ? "opacity-100" : "pointer-events-none opacity-0"
      } ${active ? "" : "cursor-pointer"}`}
      style={{
        transform: `translate(-50%, -50%) translateX(calc(var(--reel-w) * ${clamped * STEP})) scale(${active ? 1 : SIDE_SCALE})`,
        zIndex: active ? 2 : 1,
      }}
      aria-hidden={!near}
    >
      {/* Non-adjacent cards don't load their video at all. */}
      {reel.videoUrl && near && (
        <video
          ref={videoRef}
          src={reel.videoUrl}
          poster={reel.posterUrl ?? undefined}
          muted={muted}
          loop
          playsInline
          preload={active ? "auto" : "metadata"}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      {reel.videoUrl && !near && reel.posterUrl && (
        <Image src={reel.posterUrl} alt="" fill sizes="30vw" className="object-cover" />
      )}
      {/* No uploaded video: Instagram's own embed. It's display-only here
          (pointer-events-none) so the click overlay below can send the visitor
          to Instagram instead of playing inside the iframe. */}
      {!reel.videoUrl && embedUrl && near && (
        <iframe
          src={embedUrl}
          title="Instagram reel"
          loading="lazy"
          scrolling="no"
          className="pointer-events-none absolute inset-0 h-full w-full border-0 bg-white"
        />
      )}

      {/* Whole card opens the reel on Instagram. Sits under the mute button and
          product card (z-10), which keep their own clicks. */}
      {active && reel.instagramUrl && (
        <a
          href={reel.instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Watch this reel on Instagram"
          className="absolute inset-0 z-[5]"
        />
      )}

      {active && reel.videoUrl && (
        <div className="absolute right-3 top-3 z-10">
          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? "Unmute reel" : "Mute reel"}
            className="grid size-9 place-items-center rounded-full bg-black/55 text-paper backdrop-blur transition-colors hover:bg-black/80"
          >
            <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 5 6 9H3v6h3l5 4V5Z" />
              {muted ? (
                <path d="m16 9 5 6m0-6-5 6" />
              ) : (
                <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
              )}
            </svg>
          </button>
        </div>
      )}

      {product && (
        // Side cards keep the product card as a visual only — a click anywhere
        // on them brings them to the centre first (handled by the wrapper).
        <div className={`absolute inset-x-[4%] bottom-[4%] z-10 ${active ? "" : "pointer-events-none"}`}>
          <div className="flex items-center gap-3 rounded-xl bg-white p-2.5 text-black shadow-lg">
            <Link
              href={`/products/${product.slug}`}
              tabIndex={active ? 0 : -1}
              className="flex min-w-0 flex-1 items-center gap-3"
            >
              <span className="relative size-14 shrink-0 overflow-hidden rounded-md bg-neutral-100">
                {product.image && (
                  <Image src={product.image} alt="" fill sizes="56px" className="object-contain" />
                )}
              </span>
              <span className="flex min-w-0 flex-col justify-between self-stretch py-0.5">
                <span className="truncate text-sm font-medium leading-tight">{product.name}</span>
                <span className="text-xs font-semibold">{formatInr(product.price)}</span>
              </span>
            </Link>
            <Link
              href={`/products/${product.slug}`}
              tabIndex={active ? 0 : -1}
              aria-label={`View ${product.name}`}
              className="grid size-9 shrink-0 place-items-center rounded-full bg-black text-white transition-transform hover:scale-110"
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Homepage "See it in action": a three-up reel carousel — the centre reel
 * plays, the neighbours sit smaller on either side, and it wraps around. Each
 * reel carries one product as a small card along the bottom. All content
 * comes from the admin Reels page; the parent passes placeholders when none
 * exist yet.
 *
 * On phones the side cards are pushed mostly off-screen (the card width is a
 * share of the viewport), so it reads as one reel with a peek of the next.
 */
export default function ReelShowcase({ title = "See it in action", reels }: ReelShowcaseProps) {
  const [active, setActive] = useState(0);
  const drag = useRef<{ x: number } | null>(null);
  const n = reels.length;
  if (n === 0) return null;

  const go = (delta: number) => setActive((a) => (a + delta + n) % n);

  // Swipe: a horizontal drag past 40px steps one reel. touch-action: pan-y on
  // the stage keeps vertical page scroll working.
  function onPointerDown(e: PointerEvent) {
    drag.current = { x: e.clientX };
  }
  function onPointerUp(e: PointerEvent) {
    const start = drag.current;
    drag.current = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
  }

  return (
    <section
      className="w-full overflow-hidden bg-black py-16 text-paper md:py-24"
      aria-roledescription="carousel"
      aria-label={title}
    >
      <h2 className="m-0 text-center font-heading text-[clamp(32px,4.2vw,64px)] font-bold leading-none">{title}</h2>

      <div
        className="relative mx-auto mt-8 h-[calc(var(--reel-w)*1.5)] w-full touch-pan-y [--reel-w:62vw] sm:[--reel-w:min(40vw,340px)] lg:mt-12 lg:[--reel-w:min(28vw,426px)]"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (drag.current = null)}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") go(-1);
          if (e.key === "ArrowRight") go(1);
        }}
        tabIndex={0}
      >
        {reels.map((reel, i) => (
          <ReelCard key={reel.id} reel={reel} offset={ringOffset(i, active, n)} onSelect={() => setActive(i)} />
        ))}
      </div>

      {n > 1 && (
        <div className="mt-8 flex justify-center gap-2" role="tablist" aria-label="Choose reel">
          {reels.map((reel, i) => (
            <button
              key={reel.id}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`Reel ${i + 1} of ${n}`}
              onClick={() => setActive(i)}
              className={`size-2 rounded-full transition-colors ${i === active ? "bg-paper" : "bg-paper/35 hover:bg-paper/60"}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
