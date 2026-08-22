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

      {/* `gold-stagger`: os números ficam lado a lado, então a faixa de luz
          passa em um de cada vez. Todos juntos viraria pisca-pisca. */}
      {/* `grid-cols-3` fixo em vez de `auto-fit,minmax(150px,1fr)`: com 150px
          de mínimo cabiam só 2 colunas num celular de 390px e o terceiro
          número caía para uma segunda linha sozinho. São sempre três, então a
          contagem é fixa e o que se adapta é o tamanho. */}
      <div className="gold-stagger mx-auto grid max-w-[1180px] grid-cols-3 gap-x-4 sm:gap-x-10">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className={`flex flex-col gap-3 ${
              index > 0 ? "sm:border-l sm:border-gold/15 sm:pl-10" : ""
            }`}
          >
            <AnimatedCounter value={stat.value} prefix={stat.prefix} />
            <span aria-hidden="true" className="h-px w-8 bg-gold/45" />
            <span className="font-[family-name:var(--font-mono)] text-[9px] leading-[1.4] tracking-[0.1em] text-muted sm:text-[10px] sm:tracking-[0.22em]">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
