"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

interface WordFadeTextProps {
  className?: string;
  children: ReactNode;
}

/**
 * Paragraph reveal: every word sits dimmed at 20% opacity until the paragraph
 * scrolls into view, then the words light up to full one after another,
 * left to right. Pure opacity — no movement. `autoSplit` re-splits on
 * resize / font load, and inline markup like <em> survives the split.
 */
export default function WordFadeText({ className, children }: WordFadeTextProps) {
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger, SplitText);

    const ctx = gsap.context(() => {
      SplitText.create(el, {
        type: "words",
        autoSplit: true,
        // Returning the tween lets SplitText resume it at the same progress after a re-split.
        onSplit: (self) =>
          gsap.from(self.words, {
            opacity: 0.2,
            duration: 0.4,
            stagger: 0.09,
            ease: "power1.out",
            scrollTrigger: { trigger: el, start: "top 85%", once: true },
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
