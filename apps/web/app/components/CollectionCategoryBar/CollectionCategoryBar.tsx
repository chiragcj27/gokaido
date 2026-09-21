"use client";

import Image from "next/image";
import { useState } from "react";

// String geometry (px): height of the string box, resting y of its pinned ends, and how far the weight pulls it down.
const STRING_H = 16;
const STRING_Y = 4;
const SAG = 11;

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
  // Weight position on the string, kept off the very ends so the V stays well-formed.
  const weightX = Math.min(Math.max(fillPercent, 0.01), 99.99);
  const stringY = (x: number) =>
    STRING_Y + SAG * (x <= weightX ? x / weightX : (100 - x) / (100 - weightX));
  const columns = { gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` };

  const clearHover = () => setHoveredIndex(null);

  return (
    <div className="relative z-20 bg-ink px-6 py-2.5 lg:px-10">
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

            {/* The line is a taut string pinned at both ends; the icon is a weight hanging from it,
                so the string dips into a "V" whose lowest point is wherever the icon currently is. */}
            <div className="relative" style={{ gridColumn: `1 / span ${count}`, gridRow: 3, height: STRING_H }}>
              <svg
                className="absolute inset-0 h-full w-full overflow-visible"
                viewBox={`0 0 100 ${STRING_H}`}
                preserveAspectRatio="none"
                aria-hidden
              >
                <polyline
                  points={`0,${STRING_Y} ${weightX},${STRING_Y + SAG} 100,${STRING_Y}`}
                  fill="none"
                  className="stroke-paper/15"
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                />
                <polyline
                  points={`0,${STRING_Y} ${weightX},${STRING_Y + SAG}`}
                  fill="none"
                  className="stroke-red"
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
              {steps.map((step, index) => {
                const x = ((index + 0.5) / count) * 100;
                return (
                  <span
                    key={`dot-${step.key}`}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-[width,height,background-color] duration-300 ${
                      index === activeIndex ? "h-2.5 w-2.5 bg-red" : "h-1.5 w-1.5 bg-paper/30"
                    }`}
                    style={{ left: `${x}%`, top: stringY(x) }}
                  />
                );
              })}
            </div>
          </div>

          {/* icon of the active subcategory; rides along the line with scroll progress */}
          <div className="pointer-events-none relative h-12">
            <div className="absolute top-0 h-12 w-12 -translate-x-1/2" style={{ left: `${fillPercent}%` }}>
              {steps.map((step, index) => (
                <Image
                  key={`icon-${step.key}`}
                  src={step.imageSrc}
                  alt=""
                  fill
                  sizes="48px"
                  className={`object-contain transition-opacity duration-300 ${
                    index === activeIndex ? "opacity-100" : "opacity-0"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
