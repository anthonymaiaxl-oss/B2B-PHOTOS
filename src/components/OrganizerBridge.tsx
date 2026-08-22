import { eventConfig } from "@/config/event";
import Reveal from "./Reveal";

/**
 * A faixa entre o topo e o primeiro capítulo.
 *
 * Existe por dois motivos, nesta ordem:
 *
 * 1) CRÉDITO. Quem organizou o evento merece uma linha própria, e não uma
 *    menção espremida no rodapé.
 *
 * 2) TRANSIÇÃO. Antes daqui o topo terminava num corte seco: um fundo cheio de
 *    movimento acabava de uma vez e começava um preto liso. As duas pontas
 *    tinham a MESMA cor (#04060e) — o problema nunca foi a cor, foi a densidade
 *    visual caindo a zero de um pixel para o outro. Esta faixa faz a queda em
 *    três degraus: a imagem de fundo entra apagada, escurece até o preto do
 *    corpo, e no meio disso o olho tem onde pousar.
 *
 * A imagem é um dos fundos gráficos da casa, a 16%. Não é foto do evento: o
 * site inteiro segue essa regra, para ninguém confundir decoração com registro
 * do dia.
 */
export default function OrganizerBridge() {
  const { prefix, name, role, url } = eventConfig.organizer;

  const nomeClasses = "neon-gold text-[clamp(22px,6vw,40px)] font-extrabold tracking-[0.04em]";

  return (
    <section
      id="organizacao"
      className="relative overflow-hidden px-[22px] py-[clamp(74px,13vh,140px)]"
    >
      <div aria-hidden="true" className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/secoes/estrategia.jpg"
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover opacity-[0.16]"
        />
        {/* Começa e termina exatamente no preto do corpo: é isso que faz a
            faixa se costurar às duas seções em vez de virar uma terceira. */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#04060e_0%,rgba(4,6,14,0.55)_42%,rgba(4,6,14,0.78)_72%,#04060e_100%)]" />
      </div>

      <Reveal className="relative mx-auto flex max-w-[620px] flex-col items-center gap-5 text-center">
        <span aria-hidden="true" className="gold-rule w-[min(60%,180px)]" />

        <span className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.28em] text-gold/80">
          {prefix.toUpperCase()}
        </span>

        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${name} no Instagram`}
            className={`${nomeClasses} transition-[color,text-shadow] duration-300`}
          >
            {name}
          </a>
        ) : (
          <span className={nomeClasses}>{name}</span>
        )}

        <p className="m-0 text-[13px] leading-[1.6] tracking-[0.02em] text-muted">{role}</p>

        <span aria-hidden="true" className="gold-rule w-[min(60%,180px)]" />
      </Reveal>
    </section>
  );
}
