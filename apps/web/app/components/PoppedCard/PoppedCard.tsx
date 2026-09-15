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

  price?: string;
  originalPrice?: string;
  colors?: PoppedCardColor[];
  defaultColorIndex?: number;
  onColorSelect?: (color: PoppedCardColor, index: number) => void;
  onAddToCart?: () => void;
  wishlisted?: boolean;
  onToggleWishlist?: (next: boolean) => void;
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
  price,
  originalPrice,
  colors,
  defaultColorIndex = 0,
  onColorSelect,
  onAddToCart,
  wishlisted = false,
  onToggleWishlist,
}: PoppedCardProps) {
  const [colorIndex, setColorIndex] = useState(defaultColorIndex);
  const [liked, setLiked] = useState(wishlisted);

  const handleSelectColor = (event: MouseEvent, index: number) => {
    event.preventDefault();
    setColorIndex(index);
    if (colors) onColorSelect?.(colors[index], index);
  };

  const handleToggleWishlist = (event: MouseEvent) => {
    event.preventDefault();
    const next = !liked;
    setLiked(next);
    onToggleWishlist?.(next);
  };

  const card = (
    <article
      className={`relative flex flex-col pt-8${className ? ` ${className}` : ""}`}
    >
      {variant === "product" && (
        <button
          type="button"
          aria-pressed={liked}
          aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}
          onClick={handleToggleWishlist}
          className="absolute top-12 right-4 z-30 inline-flex h-8.5 w-8.5 items-center justify-center border-0 bg-transparent p-0 text-paper/80 transition-transform duration-200 hover:scale-108 aria-pressed:text-red"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path
              d="M12 20.3S3.5 15.4 1.6 10.4C.3 7 2 3.7 5.3 3.1c2-.4 4 .5 5.4 2.3l1.3 1.6 1.3-1.6c1.4-1.8 3.4-2.7 5.4-2.3 3.3.6 5 3.9 3.7 7.3C20.5 15.4 12 20.3 12 20.3z"
              fill={liked ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}

      <div
        className={
          variant === "product"
            ? "relative z-20 mx-5 -mb-10 aspect-3/2"
            : "relative z-20 mx-4 -mb-16 aspect-3/2"
        }
      >
        <div
          className={
            variant === "product"
              ? "absolute inset-0 overflow-hidden rounded-t-2xl bg-[url('/card/card_bg.png')] bg-cover bg-center"
              : "absolute inset-0 overflow-hidden rounded-t-[20px] bg-[url('/card/card_bg.png')] bg-cover bg-center"
          }
        />
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          className="z-10 scale-150 object-contain px-6 pb-10"
          style={{ top: "-2%" }}
          unoptimized={imageSrc.endsWith(".svg")}
        />
      </div>

      <div
        className={
          variant === "product"
            ? "relative z-10 flex-1 rounded-2xl border border-white/6 bg-[radial-gradient(120%_100%_at_50%_0%,#131313_0%,#060606_65%)] px-4.5 pt-14 pb-4.5"
            : "relative z-10 flex-1 rounded-[20px] border border-white/6 bg-[radial-gradient(120%_100%_at_50%_0%,#131313_0%,#060606_65%)] px-6 pt-20 pb-6"
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
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-0.5">
                {title && (
                  <h3 className="m-0 truncate font-heading text-[15px] font-bold text-paper">
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
                <div className="flex shrink-0 flex-col items-end gap-0.5 whitespace-nowrap">
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
              <div className="mt-3.5 flex items-center gap-2.5 font-sans text-xs text-paper/70">
                <span>{colors[colorIndex]?.name}</span>
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
                className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/50 bg-transparent px-4 py-3 font-heading text-[13px] font-semibold tracking-[0.02em] text-paper uppercase transition-colors duration-200 hover:bg-paper hover:text-ink"
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
