"use client";

import Image, { getImageProps } from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { createHeroReelGL, type HeroReelGL } from "./heroReelGL";

export interface HeroProps {
  videoUrl: string;
  posterUrl?: string;
  /** Phones only: a vertical (9:16) cut the reel crossfades into as it grows
   *  to full screen. Without it, phones show `videoUrl` cover-cropped. */
  mobileVideoUrl?: string;
  backgroundUrl?: string;
  /** Phones only: portrait background art, cover-cropped to the hero box.
   *  Without it, phones crop `backgroundUrl` instead. */
  mobileBackgroundUrl?: string;
  /** Product tiles in the white card between "MADE" and "TO", left to right. */
  showcaseImages?: string[];
  /** Rendered straight under the reel's end box. */
  children?: ReactNode;
}

// Phones crossfade from the horizontal reel to the vertical one while the
// morphing box passes through roughly square — keyed on the box's aspect
// (width / height) rather than scroll progress, so it lands at the same
// shape on every screen height. Near square both cuts cover-crop to a
// sensible frame, which is what keeps the swap from reading as a jump cut.
const FADE_FROM_ASPECT = 1.25;
const FADE_TO_ASPECT = 0.75;

// Only the reel that's mostly showing gets sound; the other stays muted so
// the two never play audio over each other.
function syncAudio(main: HTMLVideoElement, alt: HTMLVideoElement | null, muted: boolean, altActive: boolean) {
  main.muted = muted || altActive;
  if (alt) alt.muted = muted || !altActive;
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
 * Phones have their own layout: a large horizontal slot under the headline
 * (`mobileSlotRef`) growing into a full-screen box, with the horizontal reel
 * crossfading into `mobileVideoUrl` (vertical) on the way — see
 * FADE_FROM_ASPECT. Both videos sit in the same clipped wrapper, so they
 * share the one morphing rect; the vertical one just fades in on top.
 *
 * The scroll-indicator chevron is baked into `backgroundUrl` rather than
 * being its own element, so it can't animate independently — it just gets
 * covered as the video grows. Make it a real element if that changes.
 *
 * `showcaseImages` (the MADE/TO card) are static product tiles that scroll
 * normally — no morph, no GL, they're just images in the headline row.
 */
/**
 * Art-directed background: a <picture> so each device downloads only its own
 * art (the desktop image is ~1.5MB; two priority <Image>s toggled by CSS
 * would fetch both everywhere). Next's documented pattern for this —
 * getImageProps per source, no `priority` (it would preload both), eager +
 * high fetch priority on the <img> instead.
 */
function HeroBackground({ desktopUrl, mobileUrl }: { desktopUrl?: string; mobileUrl?: string }) {
  if (!desktopUrl && !mobileUrl) return null;
  const common = { alt: "", fill: true, sizes: "100vw", loading: "eager", fetchPriority: "high" } as const;
  const desktop = desktopUrl ? getImageProps({ ...common, src: desktopUrl }).props : null;
  const mobile = mobileUrl ? getImageProps({ ...common, src: mobileUrl }).props : null;
  // The <img> carries the phone art when there is one; the <source> then
  // swaps in the desktop art from md up.
  const { srcSet, ...img } = (mobile ?? desktop)!;
  return (
    <picture>
      {mobile && desktop && <source media="(min-width: 768px)" srcSet={desktop.srcSet} sizes={desktop.sizes} />}
      <img {...img} srcSet={srcSet} className="object-cover" />
    </picture>
  );
}

export default function Hero({
  videoUrl,
  posterUrl,
  mobileVideoUrl,
  backgroundUrl,
  mobileBackgroundUrl,
  showcaseImages,
  children,
}: HeroProps) {
  const stackRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const mobileSlotRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const videoWrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mobileVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Autoplay only works muted (browser policy) — this is the initial/default
  // state, not a permanent one. The toggle button below lets the visitor
  // opt in to sound; it never auto-unmutes itself.
  const [muted, setMuted] = useState(true);
  const [reelVisible, setReelVisible] = useState(false);
  // Mirrors for the rAF loop, which outlives renders: the crossfade flips
  // which reel carries sound, and needs the current mute choice to do it.
  const mutedRef = useRef(true);
  const altActiveRef = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    // The vertical reel (phones only) plays alongside the main one so it's
    // already moving when it fades in. Both share one rect, so the main
    // reel's visibility stands for both. Without a src (desktop) play() just
    // rejects, which is swallowed below.
    const videos = [video, mobileVideoRef.current].filter((v): v is HTMLVideoElement => v !== null);
    // Don't burn decode cycles while the reel is nowhere near the viewport.
    // Also drives the mute toggle's visibility — no point offering a sound
    // control for a video that isn't on screen.
    let visible = false;
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        setReelVisible(visible);
        for (const v of videos) {
          if (visible) v.play().catch(() => {});
          else v.pause();
        }
      },
      { threshold: 0.01 }
    );
    io.observe(video);
    // `src` is assigned after mount (see the morph effect), and loading a new
    // source resets the element to paused — so the observer's first play()
    // gets cancelled. Start again once it can actually play.
    const onCanPlay = (e: Event) => {
      const v = e.currentTarget as HTMLVideoElement;
      if (visible && v.paused) v.play().catch(() => {});
    };
    for (const v of videos) v.addEventListener("canplay", onCanPlay);
    // Fallback for when the browser refuses muted autoplay outright (iPhone
    // Low Power Mode, data saver): playback started inside a tap is always
    // allowed, so the first tap anywhere starts the reel if it's on screen.
    const onFirstTap = () => {
      for (const v of videos) if (visible && v.paused) v.play().catch(() => {});
    };
    document.addEventListener("touchend", onFirstTap, { once: true, passive: true });
    document.addEventListener("click", onFirstTap, { once: true });
    return () => {
      io.disconnect();
      for (const v of videos) v.removeEventListener("canplay", onCanPlay);
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
    mutedRef.current = muted;
    const video = videoRef.current;
    if (video) syncAudio(video, mobileVideoRef.current, muted, altActiveRef.current);
  }, [muted]);

  useEffect(() => {
    const stack = stackRef.current;
    const slot = slotRef.current;
    const mobileSlot = mobileSlotRef.current;
    const card = cardRef.current;
    const videoWrap = videoWrapRef.current;
    const video = videoRef.current;
    const mobileVideo = mobileVideoRef.current;
    const canvas = canvasRef.current;
    if (!stack || !slot || !mobileSlot || !card || !videoWrap || !video || !canvas) return;

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
    //
    // The GL path also gets its own URL. S3 only sends Access-Control-Allow-
    // Origin (and Vary: Origin) when the request has an Origin header, so a
    // copy cached by an earlier non-CORS load (plain path, devtools device
    // mode) has no CORS header — and the browser reuses it for the CORS
    // request and blocks it. A distinct query string keeps the two cache
    // entries apart; S3 ignores unknown params on public GETs (but not
    // reserved subresource names like `cors`, `acl`, `tagging` — keep it `gl`).
    if (usingGL) video.crossOrigin = "anonymous";
    else video.removeAttribute("crossorigin");
    const src = usingGL && /^https?:\/\//.test(videoUrl)
      ? `${videoUrl}${videoUrl.includes("?") ? "&" : "?"}gl=1`
      : videoUrl;
    if (video.getAttribute("src") !== src) video.src = src;

    // Phones get the headline-row slot hidden and their own slot under the
    // headline instead; whichever matches the layout is the morph's start.
    const phone = window.matchMedia("(max-width: 767px)");
    // The vertical reel only ever loads on phones (never on the GL path), so
    // desktop doesn't pay for a second video it would never show. Decided once
    // at mount, same as the GL choice above.
    const crossfade = !usingGL && phone.matches && !!mobileVideo && !!mobileVideoUrl;
    if (crossfade && mobileVideo!.getAttribute("src") !== mobileVideoUrl) mobileVideo!.src = mobileVideoUrl!;

    if (usingGL) canvas.style.visibility = "visible";
    else videoWrap.style.visibility = "visible";

    // Blend factor between the two slots, scrubbed by scroll.
    const morph = { t: 0 };

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    function paint() {
      const a = (phone.matches ? mobileSlot! : slot!).getBoundingClientRect();
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
        glRenderer!.render();
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

        if (crossfade) {
          // Smoothstep over the aspect window: eases in and out of the swap
          // instead of a linear dissolve with visible start/stop edges.
          const p = Math.min(1, Math.max(0, (FADE_FROM_ASPECT - w / h) / (FADE_FROM_ASPECT - FADE_TO_ASPECT)));
          const fade = phone.matches ? p * p * (3 - 2 * p) : 0;
          mobileVideo!.style.opacity = String(fade);
          // Belt and braces for Safari, which may not have started a reel it
          // considered invisible at opacity 0.
          if (fade > 0 && mobileVideo!.paused) mobileVideo!.play().catch(() => {});
          const altActive = fade >= 0.5;
          if (altActive !== altActiveRef.current) {
            altActiveRef.current = altActive;
            syncAudio(video!, mobileVideo, mutedRef.current, altActive);
          }
        }
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
      // Reduced motion still gets the morph: it's driven 1:1 by the visitor's
      // own scroll, not motion that plays on its own, and switching it off
      // left phones (where iOS "Reduce Motion" is a common setting) with a
      // stuck video and a broken layout. What reduced motion drops is the GL
      // twist (see wantsGL) and the scrub smoothing below, so nothing moves
      // except in lockstep with the finger.
      // No pinning: the headline scrolls away naturally while the video
      // morphs down into the reel card. Linear ease + `scrub` smoothing is
      // what gives the weighted, premium feel — an ease curve on top of a
      // scrub reads as lag, not polish.
      // Finishes exactly when the end box's top reaches the viewport top,
      // i.e. the moment it fills the screen — on phones too, now that their
      // end box is full-screen rather than a short strip. A fixed
      // `+=innerHeight` overshot (the hero's height isn't the viewport's), so
      // the reel looked full-screen at t≈0.9 with the last-staggered corner
      // (bottom-left) still peeling in until you scrolled further.
      gsap.to(morph, {
        t: 1,
        ease: "none",
        scrollTrigger: {
          trigger: stack,
          start: "top top",
          endTrigger: card,
          end: "top top",
          scrub: reduceMotion ? true : 1,
          invalidateOnRefresh: true,
        },
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
  }, [videoUrl, mobileVideoUrl]);

  return (
    <>
      <div ref={stackRef} className="relative">
        {/* md+: locked to the background art's own aspect (1602×908), not
            viewport height — a 100svh box crops the art on any screen whose
            shape differs from it. Phones: a fixed portrait box (the mobile
            design stacks the headline over a large slot), with the portrait
            art cover-cropped to it. The headline is vw-sized, so it scales
            with the box either way. */}
        <section className="relative flex aspect-[3/4] w-full md:aspect-[1602/908] shrink-0 flex-col items-center justify-center overflow-hidden bg-ink text-paper">
          {/* Background art is already near-black with its own spotlights and
              red accents — no scrim, it would only mute the glow. */}
          <HeroBackground desktopUrl={backgroundUrl} mobileUrl={mobileBackgroundUrl} />

          {/* Shimmer is per-word rather than on the whole block, with a small
              stagger, so the highlight travels through the headline in reading
              order instead of every word lighting up at once.
              Nudged up off true centre (vw, so it stays proportional at every
              size) — further on phones, to clear the floor ring in the mobile
              art. The morph reads the slots' live rects, so the video follows. */}
          <div className="relative z-10 flex w-full max-w-[90vw] flex-col items-center gap-[1vw] translate-y-[-7vw] md:translate-y-[-5vw] text-center font-heading font-bold uppercase leading-[0.9]">
            <div className="flex w-full items-center justify-center gap-[3vw] text-[11vw] md:text-[7vw]">
              <span className="shimmer-text">Made</span>
              {showcaseImages && showcaseImages.length > 0 && (
                // White card holding square product tiles side by side. The
                // card's own padding/gap are what read as the thin white
                // dividers between tiles in the design.
                <div className="hidden h-[5.6vw] shrink-0 items-stretch gap-[0.4vw] rounded-[0.9vw] bg-paper p-[0.4vw] md:flex">
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
            <div className="shimmer-text text-[16vw] md:text-[14vw]" style={{ animationDelay: "0.24s" }}>
              Change
            </div>
            <div className="flex w-full items-center justify-center gap-[3vw] text-[11vw] md:text-[7vw]">
              <span className="shimmer-text" style={{ animationDelay: "0.36s" }}>
                The
              </span>
              {/* Start of the morph. Empty — reserves layout only; the video
                  is painted over it by the fixed layer below. The red box is
                  part of the headline, not the video: it stays put when the
                  video morphs away. Outline (drawn outside the box) so the
                  video, painted exactly over the box, doesn't cover it;
                  radius matches the video's 16px start radius. */}
              <div
                ref={slotRef}
                aria-hidden="true"
                className="hidden h-[9vw] w-[13vw] shrink-0 rounded-2xl outline-solid outline-[3px] outline-[#8D1518] md:block"
              />
              <span className="shimmer-text" style={{ animationDelay: "0.48s" }}>
                Game
              </span>
            </div>
            {/* Phones' start of the morph: a large horizontal slot on its own
                row under the headline, same empty-outline idea as slotRef. */}
            <div
              ref={mobileSlotRef}
              aria-hidden="true"
              className="mt-[8vw] aspect-video w-[64vw] shrink-0 rounded-2xl outline-solid outline-[3px] outline-[#8D1518] md:hidden"
            />
          </div>
        </section>

        {/* End of the morph. A REAL in-flow element — that's what lets the
            reel scroll away naturally once it's full size, instead of being
            stuck to the viewport. */}
        <section className="relative h-[100svh] w-full bg-ink md:h-screen">
          {/* The whole viewport — on phones that's the portrait frame the
              vertical reel fills. Plain black until the video arrives. */}
          <div ref={cardRef} aria-hidden="true" className="absolute inset-0 z-10" />
        </section>

        {children}
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
        {/* Phones' vertical reel, stacked on the main one and faded in by
            paint() (see FADE_FROM_ASPECT). `src` is set by the morph effect,
            only on phones; starts muted and silent until it takes over. */}
        {mobileVideoUrl && (
          <video
            ref={mobileVideoRef}
            muted
            loop
            playsInline
            autoPlay
            preload="auto"
            className="absolute inset-0 h-full w-full object-cover opacity-0 md:hidden"
          />
        )}
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
