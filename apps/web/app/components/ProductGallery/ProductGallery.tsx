"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { ProductColorOption } from "../../lib/dummyProduct";

const HERO_INTRO_STORAGE_PREFIX = "gokaido:hero-intro:";

export interface ProductGalleryProps {
  productName: string;
  colors: ProductColorOption[];
  activeColorSlug: string;
  onColorChange: (colorSlug: string) => void;
}

export default function ProductGallery({
  productName,
  colors,
  activeColorSlug,
  onColorChange,
}: ProductGalleryProps) {
  const activeColor = colors.find((color) => color.slug === activeColorSlug) ?? colors[0];
  const [activeIndex, setActiveIndex] = useState(0);
  const isFirstImage = activeIndex === 0;
  const leftImage = activeColor.images[isFirstImage ? 0 : activeIndex - 1] ?? activeColor.images[0];
  const rightImage = isFirstImage ? null : (activeColor.images[activeIndex] ?? null);

  const [playHeroIntro, setPlayHeroIntro] = useState(false);
  useEffect(() => {
    const storageKey = `${HERO_INTRO_STORAGE_PREFIX}${productName}`;
    try {
      if (sessionStorage.getItem(storageKey)) return;
      sessionStorage.setItem(storageKey, "1");
      setPlayHeroIntro(true);
    } catch {
      // sessionStorage unavailable (e.g. private browsing) — skip the intro animation
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleColorSelect = (slug: string) => {
    setActiveIndex(0);
    onColorChange(slug);
  };

  const showPrevThumb = () =>
    setActiveIndex((index) => (index - 1 + activeColor.images.length) % activeColor.images.length);
  const showNextThumb = () => setActiveIndex((index) => (index + 1) % activeColor.images.length);

  return (
    <div className="relative aspect-1602/693 w-full overflow-hidden bg-panel">
      {/* Gallery photos are ordinary full-bleed shots (not transparent cut-outs), so each pane
          fills with object-cover: the first image spans the whole frame, and once split into
          halves each pane shows the centre of its photo with the sides cropped off. */}
      <div className={`absolute inset-0 flex ${playHeroIntro ? "animate-hero-expand" : ""}`}>
        <div
          className="relative h-full overflow-hidden"
          style={{
            flexBasis: isFirstImage ? "100%" : "50%",
            transition: "flex-basis 600ms cubic-bezier(0.65, 0, 0.35, 1)",
          }}
        >
          <div key={leftImage} className="animate-pane-fade relative h-full w-full">
            <Image
              src={leftImage}
              alt={`${productName} — ${activeColor.name}`}
              fill
              priority={isFirstImage}
              sizes="(min-width: 1440px) 1344px, 100vw"
              className="object-cover object-center"
              unoptimized={leftImage.endsWith(".svg")}
            />
          </div>
        </div>
        <div
          className="relative h-full overflow-hidden"
          style={{
            flexBasis: isFirstImage ? "0%" : "50%",
            transition: "flex-basis 600ms cubic-bezier(0.65, 0, 0.35, 1)",
          }}
        >
          {rightImage && (
            <div key={rightImage} className="animate-pane-slide-in relative h-full w-full">
              <Image
                src={rightImage}
                alt={`${productName} — ${activeColor.name}`}
                fill
                sizes="(min-width: 1440px) 672px, 50vw"
                className="object-cover object-center"
                unoptimized={rightImage.endsWith(".svg")}
              />
            </div>
          )}
        </div>
      </div>
      <div
        className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-paper/25"
        style={{
          opacity: isFirstImage ? 0 : 1,
          transition: "opacity 600ms cubic-bezier(0.65, 0, 0.35, 1)",
        }}
      />

      <div className="absolute right-6 bottom-6 flex flex-col items-end gap-3">
        <div className="flex items-center gap-2.5 rounded-lg bg-ink/70 px-3 py-1.5 backdrop-blur-sm">
          <span className="rounded bg-white/10 px-2 py-1 font-sans text-xs text-paper/70">Colors :</span>
          <span className="font-sans text-sm text-paper">{activeColor.name}</span>
          <div className="flex gap-1.5">
            {colors.map((color) => (
              <button
                key={color.slug}
                type="button"
                aria-label={color.name}
                aria-pressed={color.slug === activeColorSlug}
                onClick={() => handleColorSelect(color.slug)}
                style={{ backgroundColor: color.hex }}
                className={
                  color.slug === activeColorSlug
                    ? "h-6 w-6 cursor-pointer rounded-full border border-white/40 p-0 ring-2 ring-white/85 ring-offset-1 ring-offset-ink"
                    : "h-6 w-6 cursor-pointer rounded-full border border-white/40 p-0"
                }
              />
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {activeColor.images.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              aria-label={`View image ${index + 1}`}
              aria-pressed={index === activeIndex}
              onClick={() => setActiveIndex(index)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden border bg-panel transition-colors duration-200 ${
                index === activeIndex ? "border-paper/80" : "border-white/20 hover:border-white/40"
              }`}
            >
              <Image
                src={image}
                alt=""
                fill
                sizes="64px"
                className="object-cover object-center"
                unoptimized={image.endsWith(".svg")}
              />
            </button>
          ))}
          <button
            type="button"
            aria-label="Previous image"
            onClick={showPrevThumb}
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-ink/70 text-paper backdrop-blur-sm transition-colors duration-200 hover:bg-ink"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Next image"
            onClick={showNextThumb}
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-ink/70 text-paper backdrop-blur-sm transition-colors duration-200 hover:bg-ink"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}
