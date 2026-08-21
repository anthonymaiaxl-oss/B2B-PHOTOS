import AnimatedCounter from "./AnimatedCounter";
import type { Stat } from "@/types";

/**
 * Os números vêm do que existe de verdade no Drive — nada é fixo no código.
 * (A lógica não mudou: só a apresentação, agora com filetes dourados separando
 * as colunas, como numa página de revista.)
 */
export default function StatsSection({ stats }: { stats: Stat[] }) {
  return (
    <section className="relative px-[22px] py-[clamp(70px,11vh,120px)]">
      <div className="gold-rule absolute inset-x-0 top-0" />
      <div className="gold-rule absolute inset-x-0 bottom-0" />

      <div className="mx-auto grid max-w-[1180px] grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-x-10 gap-y-12">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className={`flex flex-col gap-3 ${
              index > 0 ? "sm:border-l sm:border-gold/15 sm:pl-10" : ""
            }`}
          >
            <AnimatedCounter value={stat.value} prefix={stat.prefix} />
            <span aria-hidden="true" className="h-px w-8 bg-gold/45" />
            <span className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.22em] text-muted">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
