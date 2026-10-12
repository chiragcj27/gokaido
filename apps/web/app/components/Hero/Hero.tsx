"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { createHeroReelGL, type HeroReelGL } from "./heroReelGL";

export interface HeroProps {
  videoUrl: string;
  posterUrl?: string;
  backgroundUrl?: string;
  /** Product tiles in the white card between "MADE" and "TO", left to right. */
  showcaseImages?: string[];
}

/**
 * Hero: "MADE TO CHANGE THE [video] GAME", where the video starts in a small
 * rounded slot mid-headline and morphs into a full-bleed reel as you scroll.
 * Modeled on upsunday.co's hero — structurally, not just visually.
 *
 * THE KEY IDEA (this is what an earlier version of this component got wrong):
 * the video is NOT tweened from a slot to a hardcoded "fullscreen" rect on a
 * layer that stays fixed forever. Instead there are TWO REAL ELEMENTS:
 *
 *   - `slotRef`  — the small empty box between "THE" and "GAME"
 *   - `cardRef`  — a full-size element in the NEXT section, in normal flow
 *
 * Every frame we read BOTH of their live `getBoundingClientRect()`s and draw
 * the video at the interpolated rect between them, with scroll progress as
 * the blend factor. Both rects are live, so they already account for page
 * scroll.
 *
 * Why that matters: at the end of the morph the drawn rect IS `cardRef`'s
 * rect — an ordinary in-flow element. Keep scrolling and that element moves
 * up the page like any other content, so the video scrolls away on its own.
 * No pinning, no "hide the fixed layer once you scroll past" hack (that hack
 * is what made the video vanish when scrolling back up), no special cases.
 * The fixed layer is only a *canvas to paint on*; the layout that drives it
 * is real DOM.
 *
 * Rendering paths (mutually exclusive, both fed the same two rects):
 *   - desktop + fine pointer + WebGL → `heroReelGL.ts` draws the video on a
 *     subdivided mesh and interpolates the rect PER VERTEX on a staggered
 *     schedule, so the plane twists/peels through the transition instead of
 *     just scaling. That's the transition effect; see that file for how.
 *   - everything else (mobile, reduced motion, no WebGL) → the plain <video>
 *     clipped with `clip-path: inset(...)` to the plainly-lerped rect. No
 *     twist — CSS clipping can't deform geometry. Honest degradation: the
 *     morph still reads correctly, it's just not as fancy.
 *
 * The scroll-indicator chevron is baked into `backgroundUrl` rather than
 * being its own element, so it can't animate independently — it just gets
 * covered as the video grows. Make it a real element if that changes.
 *
 * `showcaseImages` (the MADE/TO card) are static product tiles that scroll
 * normally — no morph, no GL, they're just images in the headline row.
 */
export default function Hero({ videoUrl, posterUrl, backgroundUrl, showcaseImages }: HeroProps) {
  const stackRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const videoWrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Autoplay only works muted (browser policy) — this is the initial/default
  // state, not a permanent one. The toggle button below lets the visitor
  // opt in to sound; it never auto-unmutes itself.
  const [muted, setMuted] = useState(true);
  const [reelVisible, setReelVisible] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    // Don't burn decode cycles while the reel is nowhere near the viewport.
    // Also drives the mute toggle's visibility — no point offering a sound
    // control for a video that isn't on screen.
    let visible = false;
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        setReelVisible(visible);
        if (visible) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.01 }
    );
    io.observe(video);
    // `src` is assigned after mount (see the morph effect), and loading a new
    // source resets the element to paused — so the observer's first play()
    // gets cancelled. Start again once it can actually play.
    const onCanPlay = () => {
      if (visible && video.paused) video.play().catch(() => {});
    };
    video.addEventListener("canplay", onCanPlay);
    // Fallback for when the browser refuses muted autoplay outright (iPhone
    // Low Power Mode, data saver): playback started inside a tap is always
    // allowed, so the first tap anywhere starts the reel if it's on screen.
    const onFirstTap = () => {
      if (visible && video.paused) video.play().catch(() => {});
    };
    document.addEventListener("touchend", onFirstTap, { once: true, passive: true });
    document.addEventListener("click", onFirstTap, { once: true });
    return () => {
      io.disconnect();
      video.removeEventListener("canplay", onCanPlay);
      document.removeEventListener("touchend", onFirstTap);
      document.removeEventListener("click", onFirstTap);
    };
  }, []);

  // Imperative, not the `muted` JSX attribute alone — React doesn't reliably
  // push updates to the `muted` DOM property after mount on every browser,
  // and the GL path never re-renders this element anyway (it just reads
  // frames off the same <video> for its texture, audio plays from here
  // regardless of which visual path is active).
  useEffect(() => {
    const video = videoRef.current;
    if (video) video.muted = muted;
  }, [muted]);

  useEffect(() => {
    const stack = stackRef.current;
    const slot = slotRef.current;
    const card = cardRef.current;
    const videoWrap = videoWrapRef.current;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!stack || !slot || !card || !videoWrap || !video || !canvas) return;

    gsap.registerPlugin(ScrollTrigger);

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // GL only where it's a genuine upgrade — touch/small screens keep the
    // plain clipped <video>, same gate upsunday uses.
    const wantsGL =
      !reduceMotion && window.matchMedia("(min-width: 768px) and (pointer: fine)").matches;
    const glRenderer: HeroReelGL | null = wantsGL ? createHeroReelGL(canvas, video) : null;
    const usingGL = glRenderer !== null;

    // `src` is set here, not in JSX, because crossOrigin has to be decided
    // first. WebGL can only sample a cross-origin (S3) video fetched with
    // CORS, but a CORS request the bucket doesn't allow for this origin makes
    // Safari refuse the video outright — which is what blanked the hero on
    // iPhones. So only the GL path asks for CORS; the plain <video> path
    // (phones, reduced motion) plays any URL without it.
    if (usingGL) video.crossOrigin = "anonymous";
    else video.removeAttribute("crossorigin");
    if (video.getAttribute("src") !== videoUrl) video.src = videoUrl;

    if (usingGL) canvas.style.visibility = "visible";
    else videoWrap.style.visibility = "visible";

    // Blend factor between the two slots, scrubbed by scroll. Reduced motion
    // leaves it at 0 so the video simply stays in the headline slot.
    const morph = { t: 0 };

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    function paint() {
      const a = slot!.getBoundingClientRect();
      const b = card!.getBoundingClientRect();
      const t = morph.t;
      const radius = lerp(16, 0, t);

      // Straight lerp of the two rects. On the GL path this is only used for
      // culling — the shader does its own PER-VERTEX interpolation, which is
      // what produces the twist. On the fallback path it's the actual rect.
      const x = lerp(a.left, b.left, t);
      const y = lerp(a.top, b.top, t);
      const w = lerp(a.width, b.width, t);
      const h = lerp(a.height, b.height, t);

            const vh = window.innerHeight;

      // Same off-screen cull upsunday does — once the reel has scrolled past,
      // stop painting entirely rather than leaving a stale frame on a layer
      // that (being fixed) would otherwise never go away on its own.
      const offScreen = w < 1 || h < 1 || y + h < 0 || y > vh;

      if (usingGL) {
        glRenderer!.setVisible(!offScreen);
        // CSS px straight through — the shader converts to clip space itself,
        // so DPR only affects the drawing-buffer size, never these numbers.
        glRenderer!.setMorph(
          { x: a.left, y: a.top, width: a.width, height: a.height },
          { x: b.left, y: b.top, width: b.width, height: b.height },
          t,
          radius
        );
      } else if (offScreen) {
        videoWrap!.style.visibility = "hidden";
      } else {
        // Size the wrapper to the rect (the <video> object-covers it) rather
        // than clipping a viewport-sized video: on a portrait phone the end
        // rect is a full-width 16:9 strip, and clipping a cover-fitted
        // portrait video would show only its cropped centre.
        videoWrap!.style.visibility = "visible";
        videoWrap!.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        videoWrap!.style.width = `${w}px`;
        videoWrap!.style.height = `${h}px`;
        videoWrap!.style.borderRadius = `${radius}px`;
      }
    }

    // One rAF loop drives everything: it re-reads both rects each frame (they
    // move with scroll, so they can't be cached) and tracks scroll velocity
    // for the GL warp. Cheap — two getBoundingClientRect calls, same as
    // upsunday's own loop.
    let rafId = 0;
    let lastY = window.scrollY;
    let velocity = 0;

    function frame() {
      if (usingGL) {
        const y = window.scrollY;
        const delta = y - lastY;
        lastY = y;
        // Normalized so a fast fling lands near ±1; smoothed so the warp
        // eases in and decays instead of snapping.
        const target = Math.max(-1, Math.min(1, delta / (window.innerHeight * 0.15)));
        velocity += (target - velocity) * 0.15;
        glRenderer!.setVelocity(velocity);
      }
      paint();
      rafId = requestAnimationFrame(frame);
    }
    rafId = requestAnimationFrame(frame);

    const ctx = gsap.context(() => {
      if (reduceMotion) return;
      // Desktop does not pin: the headline scrolls away naturally while the video morphs
      // down into the reel card. Linear ease + `scrub` smoothing is what
      // gives the weighted, premium feel — an ease curve on top of a scrub
      // reads as lag, not polish.
      const tween = (extra: ScrollTrigger.Vars) =>
        gsap.to(morph, {
          t: 1,
          ease: "none",
          scrollTrigger: {
            trigger: stack,
            start: "top top",
            scrub: 1,
            invalidateOnRefresh: true,
            ...extra,
          },
        });

      const mm = gsap.matchMedia();
      // Desktop: the end box is a full viewport below the hero, so the morph
      // takes one viewport of scroll and the reel arrives as it fills the screen.
      mm.add("(min-width: 768px)", () => {
        tween({ end: () => `+=${window.innerHeight}` });
      });
      // Phones: the end box is a short strip right under the hero, so it is
      // already on screen. Pin hero + strip while the video grows into it,
      // then release to normal scrolling. Meanwhile the next section rises
      // from the bottom and ends up just under the strip (page.tsx offsets
      // it so the two line up exactly at the end of this range). Without
      // the pin the strip scrolls away as the video arrives and it never
      // shows fully in place.
      mm.add("(max-width: 767px)", () => {
        tween({ pin: stack, end: () => `+=${window.innerHeight * 0.6}` });
      });
    }, stack);

    const handleResize = () => {
      glRenderer?.resize();
      paint();
    };
    window.addEventListener("resize", handleResize);
    document.fonts?.ready?.then(paint);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(rafId);
      glRenderer?.destroy();
      ctx.revert();
    };
  }, [videoUrl]);

  return (
    <>
      <div ref={stackRef} className="relative max-md:flex max-md:min-h-svh max-md:flex-col">
        <section className="relative flex aspect-[1602/908] w-full shrink-0 md:aspect-auto md:h-[calc(100svh-var(--navbar-h))] flex-col items-center justify-center overflow-hidden bg-ink text-paper">
          {backgroundUrl && (
            // Background art is already near-black with its own spotlights and
            // red accents — no scrim, it would only mute the glow.
            <Image src={backgroundUrl} alt="" fill priority sizes="100vw" className="object-cover" />
          )}

          {/* Shimmer is per-word rather than on the whole block, with a small
              stagger, so the highlight travels through the headline in reading
              order instead of every word lighting up at once. */}
          <div className="relative z-10 flex w-full max-w-[90vw] flex-col items-center gap-[1vw] text-center font-heading font-extrabold uppercase leading-[0.9]">
            <div className="flex w-full items-center justify-center gap-[3vw] text-[7vw]">
              <span className="shimmer-text">Made</span>
              {showcaseImages && showcaseImages.length > 0 && (
                // White card holding square product tiles side by side. The
                // card's own padding/gap are what read as the thin white
                // dividers between tiles in the design.
                <div className="flex h-[5.6vw] shrink-0 items-stretch gap-[0.4vw] rounded-[0.9vw] bg-paper p-[0.4vw]">
                  {showcaseImages.map((src) => (
                    <div key={src} className="relative aspect-square h-full overflow-hidden rounded-[0.6vw]">
                      <Image src={src} alt="" fill sizes="12vw" className="object-cover" />
                    </div>
                  ))}
                </div>
              )}
              <span className="shimmer-text" style={{ animationDelay: "0.12s" }}>
                To
              </span>
            </div>
            <div className="shimmer-text text-[14vw]" style={{ animationDelay: "0.24s" }}>
              Change
            </div>
            <div className="flex w-full items-center justify-center gap-[3vw] text-[7vw]">
              <span className="shimmer-text" style={{ animationDelay: "0.36s" }}>
                The
              </span>
              {/* Start of the morph. Empty — reserves layout only; the video
                  is painted over it by the fixed layer below. */}
              <div ref={slotRef} aria-hidden="true" className="h-[9vw] w-[13vw] shrink-0" />
              <span className="shimmer-text" style={{ animationDelay: "0.48s" }}>
                Game
              </span>
            </div>
          </div>
        </section>

        {/* End of the morph. A REAL in-flow element — that's what lets the
            reel scroll away naturally once it's full size, instead of being
            stuck to the viewport. */}
        <section className="relative w-full bg-ink max-md:flex-1 md:h-screen">
          {/* Phones: the pinned hero + strip is shorter than the screen, so
              fill the rest with the "Unify your kits" backdrop (same art as
              the next section) instead of plain black. Darkened so the reel
              strip stays the focus. */}
          <Image src="/home/unify_your_kits_bg.png" alt="" fill sizes="100vw" className="object-cover md:hidden" />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-ink via-ink/40 to-ink/20 md:hidden" />
          {/* Phones: a full-width 16:9 strip so the reel shows uncropped.
              md+: the whole viewport. */}
          <div ref={cardRef} aria-hidden="true" className="relative z-10 aspect-video w-full overflow-hidden md:absolute md:inset-0 md:aspect-auto">
            {/* Phones only: the strip sits empty under the hero until the
                video morphs into it, so show a dimmed preview of the reel
                rather than a dead black band. The real video paints over it. */}
            {posterUrl && (
              <Image src={posterUrl} alt="" fill sizes="100vw" className="object-cover opacity-30 md:hidden" />
            )}
          </div>
        </section>
      </div>

      {/* Painting surfaces. Both fixed & full-viewport; only one is ever
          visible. They carry no layout meaning — the rect they draw comes
          entirely from slotRef/cardRef above. */}
      {/* Visible from first paint below md: Safari won't autoplay a video it
          considers hidden, and won't retry once it's shown. md+ starts hidden
          until the effect picks GL (canvas) or this plain video. */}
      <div ref={videoWrapRef} className="pointer-events-none fixed left-0 top-0 z-20 overflow-hidden md:invisible">
        <video
          ref={videoRef}
          poster={posterUrl}
          muted
          loop
          playsInline
          autoPlay
          preload="metadata"
          className="h-full w-full object-cover"
        />
      </div>

      {/* w-full/h-full are load-bearing: <canvas> is a CSS replaced element,
          so `inset-0` alone does NOT size it — without these its CSS box
          falls back to its width/height attributes (the device-pixel buffer
          size), rendering it ~2x too large. */}
      <canvas ref={canvasRef} className="invisible pointer-events-none fixed inset-0 z-20 h-full w-full" />

      {/* Sound toggle. Autoplay only works muted, so this is the only way a
          visitor ever hears the reel — it never unmutes itself. Only shown
          while the reel is actually on screen (same IntersectionObserver
          that drives play/pause above), and sits on its own layer so it
          stays clickable regardless of which of the two painting surfaces
          above it (both pointer-events-none) is currently active. */}
      <button
        type="button"
        onClick={() => setMuted((m) => !m)}
        aria-label={muted ? "Unmute video" : "Mute video"}
        aria-pressed={!muted}
        className={`fixed bottom-6 right-6 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-ink/60 text-paper backdrop-blur-sm transition-opacity duration-300 ${
          reelVisible ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        {muted ? (
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        )}
      </button>
    </>
  );
}
