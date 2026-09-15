import Image from "next/image";
import type { ProtectionStat } from "../../lib/dummyProduct";

export interface SizeGuideProps {
  stats: ProtectionStat[];
}

export default function SizeGuide({ stats }: SizeGuideProps) {
  return (
    <section className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h2 className="m-0 font-heading text-xl font-bold text-paper">Protection Level</h2>
          <p className="m-0 max-w-[52ch] font-sans text-sm leading-relaxed text-paper/55">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
            dolore magna aliqua.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col gap-2 border-t border-white/10 pt-4">
              <span className="font-heading text-3xl font-extrabold text-gold">{stat.value}</span>
              <span className="font-heading text-sm font-semibold text-paper">{stat.label}</span>
              <span className="font-sans text-xs text-paper/50">{stat.description}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative flex min-h-70 flex-col overflow-hidden rounded-2xl border border-white/6 bg-panel">
        <div className="relative flex-1">
          <Image
            src="/dummy/product-placeholder.png"
            alt="Protection comparison"
            fill
            className="object-contain p-10"
          />
        </div>
        <div className="flex items-center justify-between border-t border-white/10 px-5 py-4">
          <span className="font-heading text-sm font-semibold text-paper/50">Other company</span>
          <span className="font-heading text-sm font-bold text-gold">Gokaido</span>
        </div>
      </div>
    </section>
  );
}
