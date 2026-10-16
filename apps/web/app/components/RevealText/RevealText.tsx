"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

interface RevealTextProps {
  className?: string;
  children: ReactNode;
}

// Overshoots to ~1.1 early, dips just under 1, then settles — gives each word its springy landing.
const EASE_PATH =
  "M0,0 C0.084,0.61 0.1,1.09 0.2,1.1 0.306,1.11 0.295,0.978 0.386,0.978 0.444,0.978 0.477,1 0.519,1 0.619,1 0.888,1 1,1";

/**
 * Big-copy paragraph reveal: the first time the paragraph scrolls into view its
 * words pop up one after another — each starts low, squashed thin and tall,
 * tilted at a random angle and invisible, then springs upright into place.
 * `autoSplit` re-splits on resize / font load so wrapping stays correct, and
 * inline markup like <em> survives the split.
 */
export default function RevealText({ className, children }: RevealTextProps) {
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(CustomEase, ScrollTrigger, SplitText);
    const ease = CustomEase.get("bigCopy") ?? CustomEase.create("bigCopy", EASE_PATH);

    const ctx = gsap.context(() => {
      SplitText.create(el, {
        type: "words",
        autoSplit: true,
        // Returning the tween lets SplitText resume it at the same progress after a re-split.
        onSplit: (self) =>
          gsap.from(self.words, {
            opacity: 0,
            y: 100,
            scaleX: 0.5,
            scaleY: 1.5,
            rotation: "random(-30, 30)",
            delay: 0.1,
            duration: 1.25,
            stagger: 0.035,
            ease,
            scrollTrigger: { trigger: el, start: "top 82%", once: true },
          }),
      });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <p ref={ref} className={className}>
      {children}
    </p>
  );
}
