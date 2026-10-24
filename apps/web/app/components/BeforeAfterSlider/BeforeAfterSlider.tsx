"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";

export interface BeforeAfterSliderProps {
  beforeSrc: string;
  afterSrc: string;
  beforeAlt: string;
  afterAlt: string;
  beforeLabel: string;
  afterLabel: string;
}

export default function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  beforeAlt,
  afterAlt,
  beforeLabel,
  afterLabel,
}: BeforeAfterSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const [position, setPosition] = useState(50);

  const updateFromClientX = useCallback((clientX: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const ratio = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.min(100, Math.max(0, ratio)));
  }, []);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    updateFromClientX(event.clientX);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    updateFromClientX(event.clientX);
  };

  const stopDragging = () => {
    draggingRef.current = false;
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={stopDragging}
      onPointerLeave={stopDragging}
      role="slider"
      aria-label="Compare other company and Gokaido protection"
      aria-valuenow={Math.round(position)}
      aria-valuemin={0}
      aria-valuemax={100}
      className="aspect-745/645 relative w-full max-w-[745px] touch-none overflow-hidden rounded-2xl border border-white/6 bg-panel select-none max-lg:rounded-none max-lg:border-0"
    >
      <Image
        src={afterSrc}
        alt={afterAlt}
        fill
        draggable={false}
        className="pointer-events-none object-contain p-10 max-lg:object-cover max-lg:p-0"
      />

      {/* "Before" (competitor) is the clipped layer, so it occupies the left of the handle — the same
          side as its label. Both photos are shown exactly as uploaded, with no filters. */}
      <div className="pointer-events-none absolute inset-0" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
        <Image
          src={beforeSrc}
          alt={beforeAlt}
          fill
          draggable={false}
          className="object-contain p-10 max-lg:object-cover max-lg:p-0"
        />
      </div>

      <div
        className="absolute inset-y-0 z-10 w-1 -translate-x-1/2 bg-paper shadow-[0_0_6px_rgba(0,0,0,0.6)]"
        style={{ left: `${position}%` }}
      >
        <span className="absolute top-1/2 left-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-paper bg-ink text-paper shadow-lg max-lg:h-8 max-lg:w-8">
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <path
              d="M8 7 3 12l5 5M16 7l5 5-5 5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-white/10 bg-ink/70 px-5 py-4 backdrop-blur-sm max-lg:border-0 max-lg:bg-transparent max-lg:px-2.5 max-lg:py-2 max-lg:backdrop-blur-none">
        <span className="font-heading text-[28px] font-semibold text-paper/60 max-lg:font-sans max-lg:text-[22px] max-lg:font-normal max-lg:text-paper">{beforeLabel}</span>
        <span className="font-heading text-[28px] font-bold text-gold max-lg:font-sans max-lg:text-[22px] max-lg:font-normal max-lg:text-paper">{afterLabel}</span>
      </div>
    </div>
  );
}
