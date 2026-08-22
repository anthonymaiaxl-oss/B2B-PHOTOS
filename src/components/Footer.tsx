import Link from "next/link";
import { eventConfig } from "@/config/event";
import PartnerRow from "./PartnerRow";

export default function Footer() {
  const meta = [eventConfig.date, eventConfig.location].filter(Boolean).join(" · ");
  const { prefix, name, url } = eventConfig.credit;

  return (
    <footer className="relative px-[22px] pb-10 pt-[clamp(60px,10vh,100px)]">
      <div className="gold-rule absolute inset-x-0 top-0" />

      <div className="mx-auto flex max-w-[1180px] flex-col gap-10">
        <PartnerRow compact />

        {/* No celular tudo empilha centralizado; a partir de 640px vira linha.
            Antes era `flex-wrap` com `justify-between`: ao quebrar, cada item
            ia para uma ponta oposta e o rodapé ficava esparramado, com a
            "ÁREA DA ORGANIZAÇÃO" jogada sozinha na direita. */}
        <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-end sm:justify-between sm:gap-6 sm:text-left">
          <div className="flex flex-col items-center gap-2 sm:items-start">
            <span className="text-sm font-bold tracking-[0.24em] text-white">
              {eventConfig.brand.toUpperCase()}
            </span>
            <span className="max-w-[300px] text-[13px] leading-[1.6] text-muted text-balance sm:max-w-none">
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

        {/* Filete separando os dados do evento da linha de rodapé. No celular,
            empilhado, ele é o que impede as duas partes de virarem um bloco
            único de texto solto. */}
        <span aria-hidden="true" className="h-px w-full bg-line/60" />

        <div className="flex flex-col items-center gap-3 text-center font-[family-name:var(--font-mono)] text-[9px] leading-[1.7] tracking-[0.14em] text-[#3a445f] sm:flex-row sm:justify-between sm:gap-6 sm:text-left">
          <span>
            © {eventConfig.edition} {eventConfig.brand.toUpperCase()}
          </span>

          {/* Assinatura discreta: uma linha, sem caixa, sem cor de anúncio.
              O nome sai um pouco maior que o resto de propósito — a 9px o
              brilho se sobrepõe às próprias letras e vira borrão. */}
          <span className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            {prefix}{" "}
            {url ? (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${name} no Instagram`}
                className="neon-suave text-[10.5px] font-bold tracking-[0.14em] transition-[color,text-shadow] duration-300"
              >
                {name}
              </a>
            ) : (
              <span className="neon-suave text-[10.5px] font-bold tracking-[0.14em]">{name}</span>
            )}
          </span>
        </div>
      </div>
    </footer>
  );
}
