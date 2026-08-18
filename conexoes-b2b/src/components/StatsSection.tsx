import { eventConfig } from "@/config/event";
import AnimatedCounter from "./AnimatedCounter";

export default function StatsSection() {
  return (
    <section className="border-y border-line px-[22px] py-[clamp(60px,10vh,110px)]">
      <div className="mx-auto grid max-w-[1180px] grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-10">
        {eventConfig.stats.map((stat) => (
          <div key={stat.label} className="flex flex-col gap-2">
            <AnimatedCounter value={stat.value} prefix={stat.prefix} />
            <span className="font-[family-name:var(--font-plex)] text-[10px] tracking-[0.22em] text-muted">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
