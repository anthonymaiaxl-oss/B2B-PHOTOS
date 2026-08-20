import Link from "next/link";
import { eventConfig } from "@/config/event";
import PartnerRow from "./PartnerRow";

export default function Footer() {
  const meta = [eventConfig.date, eventConfig.location].filter(Boolean).join(" · ");

  return (
    <footer className="relative px-[22px] pb-10 pt-[clamp(60px,10vh,100px)]">
      <div className="gold-rule absolute inset-x-0 top-0" />

      <div className="mx-auto flex max-w-[1180px] flex-col gap-10">
        <PartnerRow compact />

        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-bold tracking-[0.24em] text-white">
              {eventConfig.brand.toUpperCase()}
            </span>
            <span className="text-[13px] text-muted">
              {eventConfig.name}
              {meta && ` · ${meta}`}
            </span>
          </div>
          <Link
            href="/admin"
            className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.2em] text-[#3f4a68] transition-colors duration-300 hover:text-gold"
          >
            ÁREA DA ORGANIZAÇÃO
          </Link>
        </div>

        <div className="flex flex-wrap justify-between gap-4 font-[family-name:var(--font-mono)] text-[9px] tracking-[0.14em] text-[#3a445f]">
          <span>
            © {eventConfig.edition} {eventConfig.brand.toUpperCase()}
          </span>
          <span>{eventConfig.credit}</span>
        </div>
      </div>
    </footer>
  );
}
