import Image from "next/image";

// Native pixel size of the two PNGs in /presence-map — map-pins.png is a
// transparent overlay on the same canvas, so one viewBox lines up with both.
// Coordinates below were fitted against map-default.png; re-measure if it changes.
const VIEWBOX_W = 3072;
const VIEWBOX_H = 2048;

const MUMBAI = { x: 1344, y: 1106 };

// Quadratic-bezier fits of the dashed lines baked into map-default.png, used
// only as invisible motion paths for the travelling glow dots.
const ROUTES = [
  { id: "dubai", path: "M1344,1106 Q870,1034 756,770", delay: 0 },
  { id: "srilanka", path: "M1344,1106 Q1470,1420 1820,1716", delay: 0.8 },
  { id: "mauritius", path: "M1344,1106 Q2040,1120 2670,1870", delay: 1.6 },
];

// Map art + stat text are baked into flat mockup PNGs (placeholder) — not translatable until the designer's layered SVG replaces them.
export default function PresenceMap() {
  return (
    <section className="relative w-full bg-black py-16 md:py-24">
      <div className="mx-auto w-full max-w-6xl px-4">
        <div className="relative w-full" style={{ aspectRatio: `${VIEWBOX_W} / ${VIEWBOX_H}` }}>
          <Image
            src="/presence-map/map-default.png"
            alt="Gokaido's presence: 2500+ regular customers, 100+ worldwide outlets across India, Dubai, Sri Lanka and Mauritius, 50+ new styles, 98% happy users"
            fill
            sizes="(min-width: 1152px) 1152px, 100vw"
            className="object-contain"
          />

          {/* Rectangular approximation of the India landmass, not a traced outline. Must precede the pins layer (peer). */}
          <div
            aria-hidden="true"
            className="peer absolute z-20"
            style={{ left: "35%", top: "1%", width: "51%", height: "79%" }}
          />

          <Image
            src="/presence-map/map-pins.png"
            alt=""
            aria-hidden="true"
            fill
            sizes="(min-width: 1152px) 1152px, 100vw"
            className="pointer-events-none z-10 object-contain opacity-0 transition-opacity duration-500 ease-out peer-hover:opacity-100"
          />

          <svg
            className="pointer-events-none absolute inset-0 z-30 h-full w-full"
            viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
            preserveAspectRatio="xMidYMid meet"
            aria-hidden="true"
          >
            {ROUTES.map((route) => (
              <circle key={route.id} r="9" fill="#ff5252" style={{ filter: "drop-shadow(0 0 6px #ff2d2d)" }}>
                <animateMotion dur="3s" begin={`${route.delay}s`} repeatCount="indefinite" path={route.path} />
                <animate
                  attributeName="opacity"
                  values="0;1;1;0"
                  keyTimes="0;0.1;0.85;1"
                  dur="3s"
                  begin={`${route.delay}s`}
                  repeatCount="indefinite"
                />
              </circle>
            ))}
            <circle cx={MUMBAI.x} cy={MUMBAI.y} r="14" fill="none" stroke="#ff2d2d" strokeWidth="2">
              <animate attributeName="r" values="14;46;14" dur="2.4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.7;0;0.7" dur="2.4s" repeatCount="indefinite" />
            </circle>
          </svg>
        </div>
      </div>
    </section>
  );
}
