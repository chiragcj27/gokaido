"use client";

import Image from "next/image";
import { useState } from "react";
import type { ProductColorOption } from "../../lib/dummyProduct";

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
  const activeImage = activeColor.images[activeIndex] ?? activeColor.images[0];

  const handleColorSelect = (slug: string) => {
    setActiveIndex(0);
    onColorChange(slug);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-4/3 w-full overflow-hidden rounded-2xl border border-white/6 bg-[url('/card/card_bg.png')] bg-cover bg-center sm:aspect-16/11">
        <Image
          key={activeImage}
          src={activeImage}
          alt={`${productName} — ${activeColor.name}`}
          fill
          priority
          className="object-contain p-10 sm:p-16"
          unoptimized={activeImage.endsWith(".svg")}
        />

        <div className="absolute top-4 right-4 flex items-center gap-2">
          <button
            type="button"
            aria-label="Add to wishlist"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-ink/40 text-paper backdrop-blur-sm transition-colors duration-200 hover:bg-ink/70"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
              <path
                d="M12 20.3S3.5 15.4 1.6 10.4C.3 7 2 3.7 5.3 3.1c2-.4 4 .5 5.4 2.3l1.3 1.6 1.3-1.6c1.4-1.8 3.4-2.7 5.4-2.3 3.3.6 5 3.9 3.7 7.3C20.5 15.4 12 20.3 12 20.3z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Share"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-ink/40 text-paper backdrop-blur-sm transition-colors duration-200 hover:bg-ink/70"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
              <path
                d="M18 8a3 3 0 1 0-2.83-4H15a3 3 0 0 0 .05 3.24L8.9 10.5a3 3 0 1 0 0 3l6.15 3.26A3 3 0 1 0 15.5 15l-6.15-3.26a3 3 0 0 0 0-1.48L15.5 7A3 3 0 0 0 18 8z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-6">
        <div className="flex gap-3">
          {activeColor.images.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              aria-label={`View image ${index + 1}`}
              aria-pressed={index === activeIndex}
              onClick={() => setActiveIndex(index)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-[url('/card/card_bg.png')] bg-cover bg-center transition-colors duration-200 ${
                index === activeIndex ? "border-paper/80" : "border-white/10 hover:border-white/30"
              }`}
            >
              <Image src={image} alt="" fill className="object-contain p-2" unoptimized={image.endsWith(".svg")} />
            </button>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          <span className="font-sans text-xs text-paper/50">Colors: {activeColor.name}</span>
          <div className="flex gap-2">
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
                    ? "h-6 w-6 cursor-pointer rounded-full border border-white/25 p-0 ring-2 ring-white/85 ring-offset-2 ring-offset-ink"
                    : "h-6 w-6 cursor-pointer rounded-full border border-white/25 p-0"
                }
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
