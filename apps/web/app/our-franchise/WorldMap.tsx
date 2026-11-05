import Image from "next/image";

// Everything below is placed on the design's 1536×1024 map frame, converted to
// % of it so the whole arrangement scales with the page width.
const W = 1536;
const H = 1024;
const x = (px: number) => `${(px / W) * 100}%`;
const y = (px: number) => `${(px / H) * 100}%`;

const STATS = [
  { value: "4", label: "Countries", left: 97, top: 127, width: 214 },
  { value: "50+", label: "Years", left: 1026, top: 89, width: 199 },
  { value: "10,000+", label: "Dojos Served", left: 1304, top: 585, width: 158 },
  { value: "20+", label: "Stores", left: 418, top: 826, width: 111 },
];

// Dashed routes from Mumbai out to the overseas stores. Each is a rotated
// SVG centred in its box, exactly as the design positions it.
const ROUTES = [
  {
    src: "/our-franchise/route-mauritius.svg",
    box: { left: 278.95, top: 335, width: 414.788, height: 285.999 },
    size: { width: 381.852, height: 223.081 },
    rotate: -170,
    // The SVG overhangs its frame by 4% at the bottom.
    inset: "0 0 -4% 0",
  },
  {
    src: "/our-franchise/route-srilanka.svg",
    box: { left: 268.92, top: 428.24, width: 462.239, height: 467.332 },
    size: { width: 353.822, height: 342.971 },
    rotate: 115.62,
    inset: "0",
  },
  {
    src: "/our-franchise/route-dubai.svg",
    box: { left: 588, top: 540.28, width: 398, height: 328.73 },
    size: { width: 382.345, height: 309.143 },
    rotate: -3,
    inset: "-0.15% 0 -0.4% 0",
  },
];

// Store markers across India: a glowing dot with the pin standing just above it.
const DOTS: [file: string, left: number, top: number][] = [
  ["2147225705", 711, 533],
  ["2147225696", 699, 563],
  ["2147225697", 689, 617],
  ["2147225698", 744, 539],
  ["2147225702", 767, 434],
  ["2147225702", 878, 458],
  ["2147225702", 677, 453],
  ["2147225702", 667, 491],
  ["2147225702", 1062, 435],
  ["2147225706", 911, 556],
  ["2147225699", 711, 654],
  ["2147225704", 1162, 345],
  ["2147225700", 841, 688],
  ["2147225700", 740, 727],
];
const DOT_SIZE = 20.261;
const PINS: [left: number, top: number][] = [
  [1062, 418],
  [911, 542],
  [667, 473],
  [711, 518],
  [699, 545],
  [744, 522],
  [767, 416],
  [878, 440],
  [677, 435],
  [689, 599],
  [711, 639],
  [841, 674],
  [740, 713],
  [1162, 331],
];
const PIN = { width: 20, height: 28.431 };

/**
 * "Find us worldwide": the glowing map of India, Dubai, Mauritius and Sri Lanka
 * with store pins, routes out of Mumbai, and the four headline stats.
 */
export default function WorldMap() {
  return (
    <section aria-labelledby="find-us-title">
      <h1
        id="find-us-title"
        className="m-0 px-4 pt-4 pb-[clamp(1.5rem,5.5vw,5.25rem)] text-center font-heading text-[clamp(2rem,6.25vw,6rem)] leading-[1.3] font-semibold tracking-[2px] text-[#c10e12] uppercase"
      >
        Find us worldwide
      </h1>

      <div className="@container relative aspect-1536/1024 overflow-hidden bg-black">
        <Image
          src="/our-franchise/map.png"
          alt="Map of Gokaido stores across India, with stores in Dubai, Mauritius and Sri Lanka"
          fill
          sizes="(min-width: 1536px) 1536px, 100vw"
          className="object-cover"
          priority
        />

        {ROUTES.map((r) => (
          <div
            key={r.src}
            aria-hidden
            className="absolute flex items-center justify-center"
            style={{ left: x(r.box.left), top: y(r.box.top), width: x(r.box.width), height: y(r.box.height) }}
          >
            <div
              className="relative flex-none"
              style={{
                width: `${(r.size.width / r.box.width) * 100}%`,
                aspectRatio: `${r.size.width} / ${r.size.height}`,
                transform: `rotate(${r.rotate}deg)`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- static decorative SVG */}
              <img src={r.src} alt="" className="absolute block size-full max-w-none" style={{ inset: r.inset }} />
            </div>
          </div>
        ))}

        {DOTS.map(([file, left, top], i) => (
          // eslint-disable-next-line @next/next/no-img-element -- static decorative SVG
          <img
            key={`dot-${i}`}
            src={`/our-franchise/map-dot-${file}.svg`}
            alt=""
            aria-hidden
            className="absolute block max-w-none"
            style={{ left: x(left), top: y(top), width: x(DOT_SIZE), height: y(DOT_SIZE) }}
          />
        ))}
        {PINS.map(([left, top], i) => (
          <Image
            key={`pin-${i}`}
            src="/our-franchise/pin.png"
            alt=""
            aria-hidden
            width={691}
            height={980}
            sizes="40px"
            className="absolute max-w-none"
            style={{ left: x(left), top: y(top), width: x(PIN.width), height: y(PIN.height) }}
          />
        ))}

        <dl className="m-0">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="absolute flex flex-col items-center gap-[0.52cqw] text-center"
              style={{ left: x(s.left), top: y(s.top), width: x(s.width) }}
            >
              {/* Label first for <dl> semantics; the figure is visually on top. */}
              <dt className="font-sans text-[max(1.5625cqw,0.625rem)] leading-[1.3] font-medium whitespace-nowrap text-white">
                {s.label}
              </dt>
              <dd className="order-first m-0 font-heading text-[max(2.6cqw,0.875rem)] leading-none font-bold text-[#f16161]">
                {s.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
