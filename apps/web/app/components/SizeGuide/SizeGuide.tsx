import Image from "next/image";
import BeforeAfterSlider from "../BeforeAfterSlider/BeforeAfterSlider";
import type { ProtectionStat } from "../../lib/dummyProduct";

export interface SizeGuideProps {
  description: string;
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
  description,
  stats,
  comparison = { beforeSrc: PLACEHOLDER, afterSrc: PLACEHOLDER },
}: SizeGuideProps) {
  return (
    <section
      id="size-guide"
      className={`scroll-mt-24 grid grid-cols-1 gap-6 lg:gap-10 ${
        comparison ? "lg:grid-cols-[minmax(0,655fr)_minmax(0,745fr)]" : ""
      }`}
    >
      <div className="flex w-full flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h2 className="m-0 font-heading text-3xl font-bold text-paper uppercase max-lg:text-[15px] max-lg:font-semibold max-lg:tracking-[0.12em] lg:text-[40px]">
            Protection Level
          </h2>
          {description && (
            <p className="m-0 max-w-[52ch] font-sans text-base leading-relaxed text-paper/55">{description}</p>
          )}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          {STAT_ICONS.map((icon) => (
            <Image key={icon} src={icon} alt="" width={71} height={71} />
          ))}
        </div>

        <div className="hidden flex-col gap-10 lg:flex">
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

      {/* Mobile: the stats sit under the slider as a 3-up row, each with its own icon. */}
      {stats.length > 0 && (
        <div className="grid grid-cols-3 gap-3 text-center lg:hidden">
          {stats.map((stat, index) => (
            <div key={stat.label} className="flex flex-col items-center gap-1">
              <Image src={STAT_ICONS[index % STAT_ICONS.length]} alt="" width={48} height={48} className="mb-2" />
              <span className="font-sans text-lg leading-tight font-medium text-paper/85">{stat.label}</span>
              <span className="font-sans text-xs leading-snug text-paper/70">{stat.description}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
