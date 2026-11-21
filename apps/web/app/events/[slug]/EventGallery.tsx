"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import type { EventImage } from "../../lib/events";

// Photo column + right-hand minimap for /events/{slug}, after huyml.co's project pages.
// The minimap is the gallery scaled down by one factor (thumb widths, heights via each
// photo's own aspect ratio, and gaps), so the "you are here" frame is just the viewport
// rectangle times that same factor. The factor also shrinks to fit the whole column in
// ~70% of the viewport height, so 40 photos still fit.

const GAP = 24; // px between gallery photos (gap-6)
const MAP_WIDTH = 52; // px — minimap width when the column is short enough
const MAP_MAX_VH = 0.7;

export default function EventGallery({ images, name }: { images: EventImage[]; name: string }) {
  const galleryRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef(0);

  useEffect(() => {
    const gallery = galleryRef.current;
    const map = mapRef.current;
    const frame = frameRef.current;
    if (!gallery || !map || !frame) return;

    let raf = 0;

    const layout = () => {
      const { width, height } = gallery.getBoundingClientRect();
      if (!width || !height) return;
      const scale = Math.min(MAP_WIDTH / width, (window.innerHeight * MAP_MAX_VH) / height);
      scaleRef.current = scale;
      map.style.width = `${width * scale}px`;
      map.style.rowGap = `${GAP * scale}px`;
      position();
    };

    const position = () => {
      const scale = scaleRef.current;
      const top = gallery.getBoundingClientRect().top; // gallery top relative to the viewport
      const mapH = map.offsetHeight;
      const y0 = Math.min(Math.max(-top * scale, 0), mapH);
      const y1 = Math.min(Math.max((window.innerHeight - top) * scale, 0), mapH);
      frame.style.transform = `translateY(${y0}px)`;
      frame.style.height = `${Math.max(y1 - y0, 0)}px`;
      frame.style.opacity = y1 - y0 > 1 ? "1" : "0";
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(position);
    };

    // Photos load in at their natural heights, so re-lay out as the column grows.
    const ro = new ResizeObserver(layout);
    ro.observe(gallery);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", layout);
    layout();

    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", layout);
    };
  }, []);

  const scrollToPhoto = (i: number) => {
    const el = galleryRef.current?.children[i] as HTMLElement | undefined;
    if (!el) return;
    const navbar = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--navbar-h")) || 0;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - navbar - 16, behavior: "smooth" });
  };

  return (
    <>
      <div ref={galleryRef} className="flex flex-col gap-6 lg:mt-[18vh]">
        {images.map((img, i) => (
          // width/height 0 + w-full h-auto: each photo keeps its own aspect ratio (admin uploads
          // carry no stored dimensions), which the minimap relies on.
          <Image
            key={img.src + i}
            src={img.src}
            alt={img.alt || `${name} — photo ${i + 1}`}
            width={0}
            height={0}
            sizes="(min-width: 1024px) 42vw, 100vw"
            priority={i === 0}
            className="h-auto w-full bg-panel"
          />
        ))}
      </div>

      {/* Minimap (desktop) */}
      <div className="relative hidden lg:block">
        {/* Starts level with the first photo, then sticks ~centred (it's at most 70vh tall). */}
        <div className="sticky top-[max(calc(var(--navbar-h)+1.5rem),15svh)] mt-[18vh] ml-auto w-fit">
          <div ref={mapRef} className="relative flex flex-col" style={{ width: MAP_WIDTH }}>
            {images.map((img, i) => (
              <button
                key={img.src + i}
                type="button"
                onClick={() => scrollToPhoto(i)}
                aria-label={`Go to photo ${i + 1}`}
                className="block cursor-pointer border-0 bg-transparent p-0 opacity-60 transition-opacity hover:opacity-100"
              >
                <Image src={img.src} alt="" width={0} height={0} sizes="64px" className="block h-auto w-full" />
              </button>
            ))}
            <div
              ref={frameRef}
              aria-hidden
              className="pointer-events-none absolute -inset-x-1 top-0 border border-paper/80 opacity-0 transition-opacity"
            />
          </div>
        </div>
      </div>
    </>
  );
}
