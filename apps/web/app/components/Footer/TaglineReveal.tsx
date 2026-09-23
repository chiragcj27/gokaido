"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import styles from "./Footer.module.css";

/** Spotlight radius as a fraction of the tagline's rendered width. */
const RADIUS_RATIO = 0.085;
/** Per-frame easing toward the pointer / target radius (0–1, higher = snappier). */
const EASE = 0.18;

/**
 * "MADE TO CHANGE THE GAME" tagline. On hover, a soft circle around the cursor swaps the
 * solid tagline for the shattered version; everything outside the circle stays solid.
 * Both layers are CSS-masked with the same radial gradient (one inverted), driven by
 * CSS variables that a rAF loop eases toward the pointer so the reveal trails smoothly.
 */
export default function TaglineReveal() {
  const rootRef = useRef<HTMLDivElement>(null);
  const hoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const hover = hoverRef.current;
    if (!root || !hover) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ease = reduceMotion ? 1 : EASE;

    // Pointer position relative to the root box, in px.
    const target = { x: 0, y: 0, r: 0 };
    const current = { x: 0, y: 0, r: 0 };
    let frame = 0;

    const apply = () => {
      // The hover layer is offset from the root, so give it its own coordinates.
      const hx = current.x - hover.offsetLeft;
      const hy = current.y - hover.offsetTop;
      root.style.setProperty("--tx", `${current.x}px`);
      root.style.setProperty("--ty", `${current.y}px`);
      root.style.setProperty("--hx", `${hx}px`);
      root.style.setProperty("--hy", `${hy}px`);
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

    root.addEventListener("pointerenter", onEnter);
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
    return () => {
      root.removeEventListener("pointerenter", onEnter);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={rootRef} className={styles.tagline}>
      <h2 className={styles.srOnly}>Made to change the game</h2>
      <Image
        src="/footer/main%20tagline.png"
        alt=""
        width={1022}
        height={62}
        sizes="(max-width: 1100px) 100vw, 1020px"
        className={styles.taglineMain}
      />
      <div ref={hoverRef} className={styles.taglineHover} aria-hidden="true">
        <Image
          src="/footer/hover%20tagline.png"
          alt=""
          width={1020}
          height={121}
          sizes="(max-width: 1100px) 100vw, 1020px"
        />
      </div>
    </div>
  );
}
