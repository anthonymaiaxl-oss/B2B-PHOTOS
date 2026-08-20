import { eventConfig } from "@/config/event";

/** Faixa das marcas realizadoras — o mesmo bloco que aparece no selo do evento. */
export default function PartnerRow({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-x-7 gap-y-4 ${
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
