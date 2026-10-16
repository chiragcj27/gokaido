"use client";

import { useState, type MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";

export type PoppedCardVariant = "subcategory" | "product";

export interface PoppedCardColor {
  name: string;
  hex: string;
}

export interface PoppedCardProps {
  variant?: PoppedCardVariant;
  imageSrc: string;
  imageAlt: string;
  href?: string;
  className?: string;

  /** Small accent label above the heading. Subcategory variant only. */
  eyebrow?: string;
  /** Heading text — the category name (subcategory) or product name (product). */
  title?: string;
  /** Body copy under the heading. Subcategory variant only. */
  description?: string;
  /** Small gray line under the product name. Product variant only. */
  subtitle?: string;
  /** Small gold tag above the product name, e.g. a material callout. Product variant only. */
  badge?: string;

  price?: string;
  originalPrice?: string;
  colors?: PoppedCardColor[];
  defaultColorIndex?: number;
  onColorSelect?: (color: PoppedCardColor, index: number) => void;
  onAddToCart?: () => void;
}

export default function PoppedCard({
  variant = "product",
  imageSrc,
  imageAlt,
  href,
  className,
  eyebrow,
  title,
  description,
  subtitle,
  badge,
  price,
  originalPrice,
  colors,
  defaultColorIndex = 0,
  onColorSelect,
  onAddToCart,
}: PoppedCardProps) {
  const [colorIndex, setColorIndex] = useState(defaultColorIndex);

  const handleSelectColor = (event: MouseEvent, index: number) => {
    event.preventDefault();
    setColorIndex(index);
    if (colors) onColorSelect?.(colors[index], index);
  };

  const card = (
    <article
      className={`@container relative flex flex-col${className ? ` ${className}` : ""}`}
    >
      {/* imageSrc is an ordinary photo (the product's `cardImage`), so it fills the frame and is
          centre-cropped to the card's aspect ratio rather than composited over a background. */}
      <div className="relative z-20 aspect-594/470 overflow-hidden bg-panel">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          sizes="(min-width: 768px) 30vw, 60vw"
          className="object-cover object-center"
          unoptimized={imageSrc.endsWith(".svg")}
        />
      </div>

      <div
        className={
          variant === "product"
            ? "relative z-10 flex-1 px-2.5 pt-2.5 pb-3 @[260px]:px-4.5 @[260px]:pt-4 @[260px]:pb-4.5"
            : "relative z-10 flex-1 px-6 pt-6 pb-6"
        }
      >
        {variant === "subcategory" ? (
          <div className="flex flex-col gap-2">
            {eyebrow && (
              <span className="font-heading text-xs font-bold tracking-[0.08em] text-red uppercase">
                {eyebrow}
              </span>
            )}
            {title && (
              <h3 className="m-0 font-heading text-[clamp(24px,3.4vw,36px)] leading-[1.05] font-extrabold text-paper uppercase">
                {title}
              </h3>
            )}
            {description && (
              <p className="mt-1 max-w-[36ch] font-sans text-sm leading-relaxed text-paper/55">
                {description}
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col">
            {badge && (
              <span className="mb-2 self-start bg-gold px-1.5 py-0.5 font-heading text-[9px] font-bold tracking-[0.04em] text-ink uppercase">
                {badge}
              </span>
            )}
            <div className="flex flex-col gap-1 @[260px]:flex-row @[260px]:items-start @[260px]:justify-between @[260px]:gap-3">
              <div className="flex min-w-0 flex-col gap-0.5">
                {title && (
                  <h3 className="m-0 truncate font-heading text-[13px] font-bold text-paper @[260px]:text-[15px]">
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <p className="m-0 font-sans text-xs text-paper/50">
                    {subtitle}
                  </p>
                )}
              </div>
              {(price || originalPrice) && (
                <div className="flex shrink-0 flex-row items-baseline gap-1.5 whitespace-nowrap @[260px]:flex-col @[260px]:items-end @[260px]:gap-0.5">
                  {price && (
                    <span className="font-heading text-sm font-bold text-paper">
                      {price}
                    </span>
                  )}
                  {originalPrice && (
                    <span className="font-sans text-[11px] text-paper/40 line-through">
                      {originalPrice}
                    </span>
                  )}
                </div>
              )}
            </div>

            {colors && colors.length > 0 && (
              <div className="mt-2.5 flex items-center gap-2.5 font-sans text-xs text-paper/70 @[260px]:mt-3.5">
                <span className="hidden @[260px]:inline">{colors[colorIndex]?.name}</span>
                <div className="flex gap-2">
                  {colors.map((color, index) => (
                    <button
                      key={`${color.hex}-${index}`}
                      type="button"
                      aria-label={color.name}
                      aria-pressed={index === colorIndex}
                      onClick={(event) => handleSelectColor(event, index)}
                      style={{ backgroundColor: color.hex }}
                      className={
                        index === colorIndex
                          ? "h-4.5 w-4.5 cursor-pointer rounded-full border border-white/25 p-0 ring-2 ring-white/85 ring-offset-2 ring-offset-[#060606]"
                          : "h-4.5 w-4.5 cursor-pointer rounded-full border border-white/25 p-0"
                      }
                    />
                  ))}
                </div>
              </div>
            )}

            {onAddToCart && (
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  onAddToCart();
                }}
                className="mt-3 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-white/50 bg-transparent px-2 py-2 font-heading text-[11px] @[260px]:mt-4 @[260px]:gap-2 @[260px]:px-4 @[260px]:py-3 @[260px]:text-[13px] font-semibold tracking-[0.02em] text-paper uppercase transition-colors duration-200 hover:bg-paper hover:text-ink"
              >
                <span aria-hidden="true" className="text-base leading-none">
                  +
                </span>{" "}
                Add to Cart
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );

  if (href) {
    return (
      <Link href={href} className="block text-inherit no-underline">
        {card}
      </Link>
    );
  }

  return card;
}
