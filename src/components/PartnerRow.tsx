import { eventConfig } from "@/config/event";

/** Faixa das marcas realizadoras — o mesmo bloco que aparece no selo do evento. */
export default function PartnerRow({ compact = false }: { compact?: boolean }) {
  return (
    <div
      /* Grade de 2 colunas no celular em vez de `flex-wrap`: as quatro marcas
         cabiam 3 numa linha e deixavam a quarta sozinha embaixo, o que lia
         como erro de layout. Em 2×2 as duas linhas ficam cheias. A partir de
         640px volta a ser uma linha só. */
      className={`grid grid-cols-2 items-center justify-items-center gap-x-6 gap-y-5 sm:flex sm:flex-wrap sm:justify-center sm:gap-x-7 sm:gap-y-4 ${
        compact ? "" : "sm:gap-x-10"
      }`}
    >
      {eventConfig.partners.map((partner, index) => (
        <div key={partner.name} className="flex items-center gap-7 sm:gap-10">
          {index > 0 && (
            <span aria-hidden="true" className="hidden h-7 w-px bg-gold/25 sm:block" />
          )}
          <div className="flex flex-col items-center gap-1 text-center">
            <span
              className={`font-semibold uppercase tracking-[0.18em] text-white/90 ${
                compact ? "text-[11px]" : "text-[12px] sm:text-[13px]"
              }`}
            >
              {partner.name}
            </span>
            {!compact && partner.tagline && (
              <span className="max-w-[170px] font-[family-name:var(--font-mono)] text-[8px] uppercase leading-[1.5] tracking-[0.12em] text-gold/55">
                {partner.tagline}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
