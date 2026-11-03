"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import styles from "./Footer.module.css";

/** Spotlight radius as a fraction of the logo's rendered width (≈1.4× the tagline's height). */
const RADIUS_RATIO = 0.06;
/** Per-frame easing toward the pointer / target radius (0–1, higher = snappier). */
const EASE = 0.18;

/**
 * Gokaido logo with its "MADE TO CHANGE THE GAME" tagline. On hover, a soft circle around
 * the cursor swaps in the shattered-tagline version; everything outside the circle stays
 * solid. Both PNGs share one pixel frame (the logo is identical in each), so only the
 * tagline visibly changes. Only hovering the tagline band (the `taglineHotspot` box)
 * triggers the reveal; hovering the logo letters does nothing.
 * Both layers are CSS-masked with the same radial gradient (one inverted), driven by
 * CSS variables that a rAF loop eases toward the pointer so the reveal trails smoothly.
 */
export default function LogoReveal() {
  const rootRef = useRef<HTMLDivElement>(null);
  const hotspotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const hotspot = hotspotRef.current;
    if (!root || !hotspot) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ease = reduceMotion ? 1 : EASE;

    // Pointer position relative to the root box, in px.
    const target = { x: 0, y: 0, r: 0 };
    const current = { x: 0, y: 0, r: 0 };
    let frame = 0;

    const apply = () => {
      root.style.setProperty("--tx", `${current.x}px`);
      root.style.setProperty("--ty", `${current.y}px`);
      root.style.setProperty("--r", `${current.r}px`);
    };

    const tick = () => {
      current.x += (target.x - current.x) * ease;
      current.y += (target.y - current.y) * ease;
      current.r += (target.r - current.r) * ease;
      apply();
      const settled =
        Math.abs(target.x - current.x) < 0.1 &&
        Math.abs(target.y - current.y) < 0.1 &&
        Math.abs(target.r - current.r) < 0.1;
      frame = settled ? 0 : requestAnimationFrame(tick);
    };

    const start = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };

    const setTarget = (e: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      target.x = e.clientX - rect.left;
      target.y = e.clientY - rect.top;
    };

    const onEnter = (e: PointerEvent) => {
      setTarget(e);
      // Grow from the entry point instead of sliding in from the last exit point.
      current.x = target.x;
      current.y = target.y;
      target.r = root.offsetWidth * RADIUS_RATIO;
      start();
    };
    const onMove = (e: PointerEvent) => {
      setTarget(e);
      target.r = root.offsetWidth * RADIUS_RATIO;
      start();
    };
    const onLeave = () => {
      target.r = 0;
      start();
    };

    // Listen on the tagline hotspot only, but keep coordinates relative to the root,
    // which is the box both masks are drawn in.
    hotspot.addEventListener("pointerenter", onEnter);
    hotspot.addEventListener("pointermove", onMove);
    hotspot.addEventListener("pointerleave", onLeave);
    return () => {
      hotspot.removeEventListener("pointerenter", onEnter);
      hotspot.removeEventListener("pointermove", onMove);
      hotspot.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={rootRef} className={styles.logoReveal}>
      <h2 className={styles.srOnly}>Gokaido — Made to change the game</h2>
      <Image
        src="/footer/logo-tagline.png"
        alt=""
        width={2718}
        height={857}
        sizes="(max-width: 1100px) 100vw, 1020px"
        className={styles.logoMain}
        priority
      />
      <Image
        src="/footer/logo-tagline-hover.png"
        alt=""
        aria-hidden="true"
        width={2718}
        height={857}
        sizes="(max-width: 1100px) 100vw, 1020px"
        className={styles.logoHover}
      />
      <div ref={hotspotRef} className={styles.taglineHotspot} aria-hidden="true" />
    </div>
  );
}
