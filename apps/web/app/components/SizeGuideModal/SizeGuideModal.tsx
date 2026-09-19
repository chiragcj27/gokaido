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

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4 backdrop-blur-sm animate-pane-fade"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="size-guide-modal-title"
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-2xl flex-col gap-8 overflow-y-auto rounded-2xl border border-white/10 bg-ink p-6 sm:p-10"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h2 id="size-guide-modal-title" className="m-0 font-heading text-3xl font-bold text-paper uppercase">
              {sizeGuide.title}
            </h2>
            <p className="m-0 max-w-[52ch] font-sans text-sm leading-relaxed text-paper/55">
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

        <div className="border-t border-white/10" />

        {sizeGuide.measurementGuide.length > 0 && (
          <div className="flex flex-col gap-5">
            <span className="font-heading text-xs font-bold tracking-[0.08em] text-paper/50 uppercase">
              How To Measure
            </span>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
              <div className="relative w-full max-w-55 justify-self-center overflow-hidden rounded-xl bg-paper sm:justify-self-start">
                <Image
                  src={sizeGuide.measurementImageSrc}
                  alt="Diagram showing how to measure chest circumference and length"
                  width={220}
                  height={220}
                  className="h-auto w-full object-contain"
                />
                {sizeGuide.measurementGuide.map((point, index) => (
                  <span
                    key={point.letter}
                    aria-hidden="true"
                    className="absolute flex h-6 w-6 items-center justify-center rounded-full border-2 border-paper bg-red font-heading text-xs font-bold text-paper shadow-md"
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

              <div className="flex flex-col gap-4">
                {sizeGuide.measurementGuide.map((point) => (
                  <div key={point.letter} className="flex items-start gap-3">
                    <span
                      aria-hidden="true"
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red font-heading text-xs font-bold text-paper"
                    >
                      {point.letter}
                    </span>
                    <div className="flex flex-col gap-1">
                      <span className="font-heading text-sm font-semibold text-paper">{point.title}</span>
                      <span className="font-sans text-xs leading-relaxed text-paper/55">{point.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <span className="font-heading text-xs font-bold tracking-[0.08em] text-paper/50 uppercase">
              Size Chart
            </span>

            <div role="group" aria-label="Measurement unit" className="flex rounded-lg border border-white/15 p-1">
              {(["cm", "in"] as Unit[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={unit === option}
                  onClick={() => setUnit(option)}
                  className={`cursor-pointer rounded-md px-3 py-1 font-heading text-xs font-bold uppercase transition-colors duration-200 ${
                    unit === option ? "bg-red text-paper" : "bg-transparent text-paper/50 hover:text-paper"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-white/10">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/3">
                  <th className="px-4 py-3 text-left font-sans text-xs font-semibold text-paper/50">Size</th>
                  <th className="px-4 py-3 text-right font-sans text-xs font-semibold text-paper/50">
                    Chest Circumference{chestPoint ? ` (${chestPoint.letter})` : ""}
                  </th>
                  <th className="px-4 py-3 text-right font-sans text-xs font-semibold text-paper/50">
                    Length{lengthPoint ? ` (${lengthPoint.letter})` : ""}
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
                          className={`flex w-full items-center gap-3 px-4 py-3 text-left ${
                            available ? "cursor-pointer" : "cursor-not-allowed"
                          }`}
                        >
                          <span
                            aria-hidden="true"
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                              selected ? "border-red" : "border-white/30"
                            }`}
                          >
                            {selected && <span className="h-2 w-2 rounded-full bg-red" />}
                          </span>
                          <span className="font-heading text-sm font-bold text-paper">{row.size}</span>
                          {!available && (
                            <span className="font-sans text-[10px] tracking-[0.06em] text-paper/40 uppercase">
                              Unavailable
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right font-sans text-sm text-paper/70">
                        {formatMeasurement(row.chestMinCm, unit)} - {formatMeasurement(row.chestMaxCm, unit)}
                      </td>
                      <td className="px-4 py-3 text-right font-sans text-sm text-paper/70">
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
          <div className="flex items-start gap-3 border-t border-white/10 pt-4">
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-paper/50"
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
            <p className="m-0 font-sans text-xs leading-relaxed text-paper/50">{sizeGuide.footerNote}</p>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
