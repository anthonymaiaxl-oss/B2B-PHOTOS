import { eventConfig } from "@/config/event";

export default function Footer() {
  return (
    <footer className="border-t border-line px-[22px] pb-10 pt-[clamp(60px,10vh,100px)]">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-7">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold tracking-[0.24em]">
              {eventConfig.name.toUpperCase()}
            </span>
            <span className="text-[13px] text-muted">
              Os momentos que conectaram negócios.
            </span>
          </div>
          <span className="font-[family-name:var(--font-plex)] text-[10px] tracking-[0.2em] text-[#4c4757]">
            DIGITAL EXPERIENCE
          </span>
        </div>
        <div className="flex flex-wrap justify-between gap-4 font-[family-name:var(--font-plex)] text-[9px] tracking-[0.14em] text-[#3d3949]">
          <span>
            © {eventConfig.edition} {eventConfig.name.toUpperCase()}
          </span>
          <span>{eventConfig.credit}</span>
        </div>
      </div>
    </footer>
  );
}
