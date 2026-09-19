import Image from "next/image";
import BeforeAfterSlider from "../BeforeAfterSlider/BeforeAfterSlider";
import type { ProtectionStat } from "../../lib/dummyProduct";

export interface SizeGuideProps {
  stats: ProtectionStat[];
  /** Undefined = dummy placeholder photos (sample product); null = hide the slider. */
  comparison?: { beforeSrc: string; afterSrc: string } | null;
}

const STAT_ICONS = [
  "/protection_level/coverage.png",
  "/protection_level/impact.png",
  "/protection_level/grade.png",
];

const PLACEHOLDER = "/dummy/product-placeholder.png";

export default function SizeGuide({
  stats,
  comparison = { beforeSrc: PLACEHOLDER, afterSrc: PLACEHOLDER },
}: SizeGuideProps) {
  return (
    <section
      id="size-guide"
      className={`scroll-mt-24 grid grid-cols-1 gap-10 lg:gap-10 ${
        comparison ? "lg:grid-cols-[655px_745px] lg:justify-between" : ""
      }`}
    >
      <div className="flex w-full flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h2 className="m-0 font-heading text-3xl font-bold text-paper uppercase lg:text-[40px]">
            Protection Level
          </h2>
          <p className="m-0 max-w-[52ch] font-sans text-base leading-relaxed text-paper/55">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
            dolore magna aliqua.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {STAT_ICONS.map((icon) => (
            <Image key={icon} src={icon} alt="" width={71} height={71} />
          ))}
        </div>

        <div className="flex flex-col gap-10">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col gap-2">
              {stat.value && (
                <span className="font-heading text-[40px] leading-tight font-bold text-paper">{stat.value}</span>
              )}
              <span className="font-heading text-lg font-semibold text-paper">{stat.label}</span>
              <span className="font-sans text-sm text-paper/50">{stat.description}</span>
            </div>
          ))}
        </div>
      </div>

      {comparison && (
        <BeforeAfterSlider
          beforeSrc={comparison.beforeSrc}
          afterSrc={comparison.afterSrc}
          beforeAlt="Other company protection"
          afterAlt="Gokaido protection"
          beforeLabel="Other company"
          afterLabel="Gokaido"
        />
      )}
    </section>
  );
}
