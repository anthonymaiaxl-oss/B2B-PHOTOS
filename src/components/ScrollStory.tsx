"use client";

import { eventConfig } from "@/config/event";
import ParallaxImage from "./ParallaxImage";
import Reveal from "./Reveal";
import type { AlbumWithPhotos } from "@/types";

/**
 * Os quatro capítulos editoriais do evento.
 *
 * Layout alternado: texto à esquerda / imagem à direita, e o contrário no
 * capítulo seguinte. É o que dá ritmo de revista impressa em vez de "lista de
 * seções". No celular tudo empilha na ordem natural de leitura.
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
            <Reveal
              key={chapter.num}
              className="grid grid-cols-1 items-center gap-8 md:grid-cols-12 md:gap-12"
            >
              <div
                className={`flex flex-col gap-5 md:col-span-5 ${
                  flipped ? "md:order-2" : "md:order-1"
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.18em] text-gold">
                    {chapter.num}
                  </span>
                  <span aria-hidden="true" className="h-px flex-1 bg-gold/25" />
                </div>

                <h2 className="text-gold-gradient m-0 pb-[0.06em] text-[clamp(32px,9vw,72px)] font-extrabold leading-[0.92] tracking-[-0.035em]">
                  {chapter.word}
                </h2>

                <p className="m-0 max-w-[420px] text-[15px] leading-[1.7] text-muted text-pretty">
                  {chapter.text}
                </p>
              </div>

              <ParallaxImage
                photo={photo}
                alt={`${chapter.word} — ${eventConfig.name}`}
                depth={0.1 + index * 0.02}
                className={`aspect-[4/3] w-full rounded-[4px] border border-gold/12 md:col-span-7 md:aspect-[3/2] ${
                  flipped ? "md:order-1" : "md:order-2"
                }`}
              />
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
