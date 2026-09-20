"use client";

import Image from "next/image";
import { useState } from "react";

export interface CollectionBarStep {
  key: string;
  title: string;
  imageSrc: string;
}

export interface CollectionCategoryBarProps {
  categoryName: string;
  steps: CollectionBarStep[];
  /** Continuous scroll progress across steps (0..steps.length-1) — drives the animated fill. */
  progress: number;
  activeIndex: number;
  onStepClick?: (index: number) => void;
}

export default function CollectionCategoryBar({
  categoryName,
  steps,
  progress,
  activeIndex,
  onStepClick,
}: CollectionCategoryBarProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const count = steps.length;
  const fillPercent =
    count > 1 ? Math.min(Math.max(((progress + 0.5) / count) * 100, 0), 100) : 100;
  const columns = { gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` };

  const clearHover = () => setHoveredIndex(null);

  return (
    <div className="relative z-20 border-b border-white/10 bg-ink px-6 py-2.5 lg:px-10">
      <div className="flex items-center gap-6 lg:gap-10">
        <h2 className="shrink-0 font-heading text-lg font-extralight tracking-wide text-paper/90 lg:text-xl">
          {categoryName}
        </h2>

        <div className="relative flex-1">
          {/* interaction layer — one hit-target per step, decoupled from the visual rows below */}
          <div className="absolute inset-0 z-10 grid" style={columns}>
            {steps.map((step, index) => (
              <button
                key={`hit-${step.key}`}
                type="button"
                aria-label={step.title}
                aria-current={index === activeIndex ? "step" : undefined}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={clearHover}
                onFocus={() => setHoveredIndex(index)}
                onBlur={clearHover}
                onClick={() => onStepClick?.(index)}
                className="cursor-pointer border-0 bg-transparent p-0"
              />
            ))}
          </div>

          {/* visual rows: number / title / line+dots — purely presentational */}
          <div className="pointer-events-none relative grid gap-y-1" style={columns}>
            {steps.map((step, index) => (
              <span
                key={`num-${step.key}`}
                style={{ gridColumn: index + 1, gridRow: 1 }}
                className={`text-center font-sans text-[10px] leading-none tracking-[0.08em] transition-colors duration-300 ${
                  index === activeIndex ? "text-red" : "text-paper/40"
                }`}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
            ))}

            {steps.map((step, index) => (
              <span
                key={`title-${step.key}`}
                style={{ gridColumn: index + 1, gridRow: 2 }}
                className={`truncate text-center font-heading text-xs transition-colors duration-300 lg:text-sm ${
                  index === activeIndex ? "font-semibold text-red" : "text-paper/70"
                }`}
              >
                {step.title}
              </span>
            ))}

            <div className="relative h-3" style={{ gridColumn: `1 / span ${count}`, gridRow: 3 }}>
              <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-paper/15" />
              <div
                className="absolute top-1/2 left-0 h-px -translate-y-1/2 bg-red transition-[width] duration-500 ease-out"
                style={{ width: `${fillPercent}%` }}
              />
              {steps.map((step, index) => (
                <span
                  key={`dot-${step.key}`}
                  className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-300 ${
                    index === activeIndex ? "h-2.5 w-2.5 bg-red" : "h-1.5 w-1.5 bg-paper/30"
                  }`}
                  style={{ left: `${((index + 0.5) / count) * 100}%` }}
                />
              ))}
            </div>
          </div>

          {/* hover / active preview image, floating just below the line */}
          <div className="pointer-events-none absolute inset-x-0 top-full grid" style={columns}>
            {steps.map((step, index) => (
              <div key={`preview-${step.key}`} className="flex justify-center" style={{ gridColumn: index + 1 }}>
                <div
                  className={`relative mt-2 h-12 w-12 transition-all duration-300 ease-out ${
                    hoveredIndex === index ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"
                  }`}
                >
                  <Image src={step.imageSrc} alt="" fill sizes="48px" className="object-contain" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
