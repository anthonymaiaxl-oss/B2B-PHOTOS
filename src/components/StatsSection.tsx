import AnimatedCounter from "./AnimatedCounter";
import type { Stat } from "@/types";

/** Os números vêm do que existe de verdade no Drive — nada é fixo no código. */
export default function StatsSection({ stats }: { stats: Stat[] }) {
  return (
    <section className="relative px-[22px] py-[clamp(60px,10vh,110px)]">
      <div className="gold-rule absolute inset-x-0 top-0" />
      <div className="gold-rule absolute inset-x-0 bottom-0" />
      <div className="mx-auto grid max-w-[1180px] grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-10">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col gap-2">
            <AnimatedCounter value={stat.value} prefix={stat.prefix} />
            <span className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.22em] text-muted">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
