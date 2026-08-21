"use client";

import { eventConfig } from "@/config/event";
import ParallaxImage from "./ParallaxImage";
import Reveal from "./Reveal";
import type { AlbumWithPhotos } from "@/types";

/**
 * Os quatro capítulos editoriais do evento.
 *
 * Estrutura de cada capítulo:
 *
 *    01 ─────────────────────────────────────────
 *    CONHECIMENTO                    (largura total)
 *    [ texto 4 col ]  [ imagem 8 col ]   (alternando)
 *
 * O título ocupa a LARGURA TOTAL de propósito. Numa versão anterior ele
 * dividia a linha com a imagem, dentro de uma coluna de ~460px — e
 * "CONHECIMENTO" (12 caracteres em ExtraBold a 72px) mede bem mais que isso.
 * As duas palavras mais largas do conjunto, CONHECIMENTO e NETWORKING,
 * transbordavam a coluna e apareciam cortadas na tela.
 *
 * Em largura total sobram mais de 1100px para a maior delas, e o tamanho da
 * fonte ainda cresce com a viewport. `hyphens-auto` fica só como rede de
 * segurança para telas muito estreitas: quebra a palavra em vez de cortá-la.
 *
 * As fotos continuam vindo do Drive — nenhuma imagem fixa no código.
 */
export default function ScrollStory({ albums }: { albums: AlbumWithPhotos[] }) {
  return (
    <section className="px-[22px]">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-[clamp(90px,17vh,180px)] py-[clamp(80px,15vh,160px)]">
        {eventConfig.story.map((chapter, index) => {
          const album = albums.length ? albums[index % albums.length] : null;
          const photo = album?.photos[1] ?? album?.cover ?? null;
          const flipped = index % 2 === 1;

          return (
            <Reveal key={chapter.num} className="flex flex-col gap-7">
              <div className="flex items-center gap-4">
                <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.18em] text-gold">
                  {chapter.num}
                </span>
                <span aria-hidden="true" className="h-px flex-1 bg-gold/25" />
              </div>

              <h2 className="text-gold-gradient m-0 hyphens-auto pb-[0.06em] text-[clamp(30px,8vw,88px)] font-extrabold leading-[0.95] tracking-[-0.035em]">
                {chapter.word}
              </h2>

              <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:items-end md:gap-10">
                <p
                  className={`m-0 min-w-0 text-[15px] leading-[1.7] text-muted text-pretty md:col-span-4 ${
                    flipped ? "md:order-2" : "md:order-1"
                  }`}
                >
                  {chapter.text}
                </p>

                <ParallaxImage
                  photo={photo}
                  alt={`${chapter.word} — ${eventConfig.name}`}
                  depth={0.1 + index * 0.02}
                  className={`aspect-[4/3] w-full rounded-[4px] border border-gold/12 md:col-span-8 md:aspect-[16/9] ${
                    flipped ? "md:order-1" : "md:order-2"
                  }`}
                />
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
