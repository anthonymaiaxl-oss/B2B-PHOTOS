import Link from "next/link";
import { eventConfig } from "@/config/event";
import ParallaxImage from "./ParallaxImage";
import Reveal from "./Reveal";
import type { AlbumWithPhotos, Photo } from "@/types";

/**
 * Fechamento da home. O link continua indo para o primeiro álbum publicado —
 * mesma lógica de antes; só o texto e o desenho mudaram.
 */
export default function CTASection({
  photo,
  albums,
}: {
  photo: Photo | null;
  albums: AlbumWithPhotos[];
}) {
  const first = albums[0];

  return (
    <section className="relative flex min-h-[82svh] items-center overflow-hidden px-[22px]">
      <ParallaxImage
        photo={photo}
        src={eventConfig.sectionImages.cta || undefined}
        alt=""
        depth={0.14}
        className="absolute inset-0"
      />
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(180deg,#04060e,rgba(8,18,39,0.55)_45%,#04060e)]"
      />
      <span aria-hidden="true" className="vignette absolute inset-0" />

      <Reveal className="relative mx-auto flex w-full max-w-[1180px] flex-col items-start gap-7">
        <h2 className="m-0 max-w-[980px] text-[clamp(32px,9vw,96px)] font-extrabold leading-[0.94] tracking-[-0.04em] text-white">
          <span className="block">{eventConfig.finalCta.lineOne}</span>
          <span className="text-gold-gradient block">
            {eventConfig.finalCta.lineTwo}
          </span>
        </h2>

        <div className="flex items-center gap-4">
          <span aria-hidden="true" className="h-px w-10 bg-gold/50" />
          <span className="text-[11px] font-bold tracking-[0.34em] text-white/90 sm:text-[13px]">
            {eventConfig.brand.toUpperCase()}
          </span>
        </div>

        {/* Frase preservada da versão anterior: continua sendo a informação
            mais útil desta seção para quem chega procurando a própria foto. */}
        <p className="m-0 max-w-[430px] text-[15px] leading-[1.7] text-muted text-pretty">
          Baixe em alta resolução, uma por uma ou várias de uma vez. Sem cadastro,
          sem marca d&apos;água.
        </p>

        {first && (
          <Link
            href={`/album/${first.id}`}
            data-cursor="→"
            className="gold-sheen flex min-h-[54px] w-fit items-center rounded-full bg-gradient-to-b from-gold-bright to-gold px-9 text-[11px] font-bold tracking-[0.2em] text-ink transition-all duration-300 hover:-translate-y-0.5 hover:from-white hover:to-gold-bright"
          >
            {eventConfig.finalCta.button}
          </Link>
        )}
      </Reveal>
    </section>
  );
}
