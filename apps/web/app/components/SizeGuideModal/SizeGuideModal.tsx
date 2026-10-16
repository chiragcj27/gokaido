"use client";

import Image from "next/image";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import type { SizeGuide } from "../../lib/dummyProduct";

export interface SizeGuideModalProps {
  open: boolean;
  onClose: () => void;
  sizeGuide: SizeGuide;
  /** Sizes this specific product/color actually offers — every other chart row renders disabled. */
  availableSizes: string[];
  activeSize: string;
  onSizeSelect: (size: string) => void;
}

type Unit = "cm" | "in";

const CM_TO_IN = 0.393701;

function formatMeasurement(valueCm: number, unit: Unit) {
  if (unit === "cm") return `${Math.round(valueCm)}`;
  return (valueCm * CM_TO_IN).toFixed(1);
}

export default function SizeGuideModal({
  open,
  onClose,
  sizeGuide,
  availableSizes,
  activeSize,
  onSizeSelect,
}: SizeGuideModalProps) {
  const [unit, setUnit] = useState<Unit>("cm");
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    closeButtonRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const [chestPoint, lengthPoint] = sizeGuide.measurementGuide;

  // The mobile design highlights the title's last word in red ("SIZE GUIDE").
  const titleWords = sizeGuide.title.trim().split(/\s+/);
  const titleLead = titleWords.slice(0, -1).join(" ");
  const titleLast = titleWords[titleWords.length - 1];

  // Below `lg` the design is a full-screen sheet ordered header → size chart → how to measure → note;
  // desktop keeps the centred dialog with how-to-measure first. Sections use `order` to swap.
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4 backdrop-blur-sm animate-pane-fade max-lg:p-0"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="size-guide-modal-title"
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-2xl flex-col gap-8 overflow-y-auto rounded-2xl border border-white/10 bg-ink p-6 sm:p-10 max-lg:h-full max-lg:max-h-none max-lg:max-w-none max-lg:gap-10 max-lg:rounded-none max-lg:border-0 max-lg:px-5 max-lg:py-8"
      >
        <div className="flex items-start justify-between gap-4 max-lg:order-1">
          <div className="flex flex-col gap-2 max-lg:gap-5">
            <h2
              id="size-guide-modal-title"
              className="m-0 font-heading text-3xl font-bold text-paper uppercase max-lg:text-[28px]"
            >
              {titleLead && `${titleLead} `}
              <span className="max-lg:text-red">{titleLast}</span>
            </h2>
            <p className="m-0 max-w-[52ch] font-sans text-sm leading-relaxed text-paper/55 max-lg:text-[13px] max-lg:leading-[1.8] max-lg:text-paper/70">
              {sizeGuide.description}
            </p>
          </div>
          <button
            type="button"
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Close size guide"
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-transparent text-paper transition-colors duration-200 hover:border-white/40"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
              <path
                d="M6 6l12 12M18 6L6 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="border-t border-white/10 max-lg:hidden" />

        {sizeGuide.measurementGuide.length > 0 && (
          <div className="flex flex-col gap-5 max-lg:order-3">
            <span className="font-heading text-xs font-bold tracking-[0.08em] text-paper/50 uppercase max-lg:text-2xl max-lg:font-normal max-lg:tracking-wide max-lg:text-paper">
              How To Measure
            </span>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[auto_1fr] lg:items-center">
              <div className="relative w-full max-w-55 justify-self-center overflow-hidden rounded-xl bg-paper lg:justify-self-start max-lg:max-w-none max-lg:rounded-none">
                <Image
                  src={sizeGuide.measurementImageSrc}
                  alt="Diagram showing how to measure chest circumference and length"
                  width={220}
                  height={220}
                  sizes="(max-width: 1023px) 100vw, 220px"
                  className="h-auto w-full object-contain"
                />
                {/* Desktop overlays A/B markers on the small thumbnail; the mobile design shows the
                    diagram full-width with its own annotations, so the markers are hidden there. */}
                {sizeGuide.measurementGuide.map((point, index) => (
                  <span
                    key={point.letter}
                    aria-hidden="true"
                    className="absolute flex h-6 w-6 items-center justify-center rounded-full border-2 border-paper bg-red font-heading text-xs font-bold text-paper shadow-md max-lg:hidden"
                    style={
                      index === 0
                        ? { top: "26%", right: "6%", transform: "translate(50%, -50%)" }
                        : { bottom: "4%", left: "50%", transform: "translate(-50%, 50%)" }
                    }
                  >
                    {point.letter}
                  </span>
                ))}
              </div>

              <div className="flex flex-col gap-4 max-lg:gap-6">
                {sizeGuide.measurementGuide.map((point) => (
                  <div key={point.letter} className="flex items-start gap-3 max-lg:gap-5">
                    <span
                      aria-hidden="true"
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red font-heading text-xs font-bold text-paper max-lg:h-11 max-lg:w-11 max-lg:text-base"
                    >
                      {point.letter}
                    </span>
                    <div className="flex flex-col gap-1 max-lg:gap-2">
                      <span className="font-heading text-sm font-semibold text-paper max-lg:font-sans max-lg:text-lg">
                        {point.title}
                      </span>
                      <span className="font-sans text-xs leading-relaxed text-paper/55 max-lg:text-[13px] max-lg:leading-[1.7] max-lg:text-paper/70">
                        {point.description}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4 max-lg:order-2 max-lg:gap-6">
          <div className="flex items-center justify-between gap-4">
            <span className="font-heading text-xs font-bold tracking-[0.08em] text-paper/50 uppercase max-lg:text-2xl max-lg:tracking-wide max-lg:text-paper">
              Size Chart
            </span>

            <div
              role="group"
              aria-label="Measurement unit"
              className="flex rounded-lg border border-white/15 p-1 max-lg:border-white/25"
            >
              {(["cm", "in"] as Unit[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={unit === option}
                  onClick={() => setUnit(option)}
                  className={`cursor-pointer rounded-md px-3 py-1 font-heading text-xs font-bold uppercase transition-colors duration-200 max-lg:px-6 max-lg:py-1.5 ${
                    unit === option ? "bg-red text-paper" : "bg-transparent text-paper/50 hover:text-paper"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-white/10 max-lg:border-white/20">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/3">
                  <th className="px-4 py-3 text-left font-sans text-xs font-semibold text-paper/50 max-lg:py-5 max-lg:text-paper/80">
                    Size
                  </th>
                  <th className="px-4 py-3 text-right font-sans text-xs font-semibold text-paper/50 max-lg:py-5 max-lg:text-center max-lg:text-paper/80">
                    Chest Circumference{chestPoint ? ` (${chestPoint.letter})` : ""}
                    <span className="block font-normal text-paper/50 lg:hidden">{unit}</span>
                  </th>
                  <th className="px-4 py-3 text-right font-sans text-xs font-semibold text-paper/50 max-lg:py-5 max-lg:text-paper/80">
                    Length{lengthPoint ? ` (${lengthPoint.letter})` : ""}
                    <span className="block font-normal text-paper/50 lg:hidden">{unit}</span>
                  </th>
                </tr>
              </thead>
              <tbody role="radiogroup" aria-label="Select your size">
                {sizeGuide.sizeChart.map((row) => {
                  const selected = row.size === activeSize;
                  const available = availableSizes.includes(row.size);
                  return (
                    <tr
                      key={row.size}
                      className={`border-b border-white/10 last:border-b-0 ${available ? "" : "opacity-40"}`}
                    >
                      <td className="p-0">
                        <button
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          aria-disabled={!available}
                          disabled={!available}
                          onClick={() => available && onSizeSelect(row.size)}
                          className={`flex w-full items-center gap-3 px-4 py-3 text-left max-lg:gap-4 max-lg:py-4.5 ${
                            available ? "cursor-pointer" : "cursor-not-allowed"
                          }`}
                        >
                          <span
                            aria-hidden="true"
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border max-lg:h-5 max-lg:w-5 max-lg:border-2 ${
                              selected ? "border-red" : "border-white/30 max-lg:border-white/50"
                            }`}
                          >
                            {selected && <span className="h-2 w-2 rounded-full bg-red max-lg:h-2.5 max-lg:w-2.5" />}
                          </span>
                          <span className="font-heading text-sm font-bold text-paper max-lg:font-sans max-lg:text-base">
                            {row.size}
                          </span>
                          {!available && (
                            <span className="font-sans text-[10px] tracking-[0.06em] text-paper/40 uppercase">
                              Unavailable
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right font-sans text-sm text-paper/70 max-lg:text-center max-lg:text-base max-lg:text-paper/80">
                        {formatMeasurement(row.chestMinCm, unit)} - {formatMeasurement(row.chestMaxCm, unit)}
                      </td>
                      <td className="px-4 py-3 text-right font-sans text-sm text-paper/70 max-lg:text-base max-lg:text-paper/80">
                        {formatMeasurement(row.lengthCm, unit)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {sizeGuide.footerNote && (
          <div className="flex items-start gap-3 border-t border-white/10 pt-4 max-lg:order-4 max-lg:items-center max-lg:gap-4 max-lg:rounded-xl max-lg:border max-lg:border-red/40 max-lg:bg-red/15 max-lg:p-5">
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-paper/50 max-lg:mt-0 max-lg:h-6 max-lg:w-6 max-lg:text-red"
            >
              <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.4" />
              <path
                d="M12 11v5M12 8v.01"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
            <p className="m-0 font-sans text-xs leading-relaxed text-paper/50 max-lg:text-[11px] max-lg:leading-[1.8] max-lg:text-paper/70">
              {sizeGuide.footerNote}
            </p>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
