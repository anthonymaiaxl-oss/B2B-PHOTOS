"use client";

import { eventConfig } from "@/config/event";
import ParallaxImage from "./ParallaxImage";
import Reveal from "./Reveal";
import StrategyChart from "./StrategyChart";
import type { AlbumWithPhotos, Photo } from "@/types";

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
/**
 * Ponto de corte de cada capítulo, na mesma ordem de `sectionImages.story`
 * (01 CONHECIMENTO, 02 NETWORKING, 03 ESTRATÉGIA, 04 MOMENTOS).
 *
 * O quadro é 4/3 no celular e 16/9 no desktop, e o parallax ainda mostra só a
 * parte central. Uma imagem cujo assunto não está no meio precisa dizer para
 * onde puxar o corte, senão o assunto some justamente na tela pequena.
 *
 * CONHECIMENTO: o notebook está à direita na foto. No celular puxa para 78%,
 * o que mantém a tela inteira no quadro; no desktop cabe tudo e volta ao
 * centro, preservando o homem e a caneca na composição.
 *
 * NETWORKING: a frase "CONEXÕES QUE GERAM VALOR" está na parede à direita e
 * ficava cortada no meio da palavra VALOR. 61% resolve sem perder o aperto de
 * mão, que continua no centro do quadro.
 *
 * Vazio = corte centrado, que é o certo para os fundos gráficos abstratos.
 */
const STORY_FOCUS = [
  "object-[78%_50%] md:object-center",
  "object-[61%_50%] md:object-center",
  "",
  "",
];

/**
 * ESTRATÉGIA (03) não usa imagem: usa a linha animada de `StrategyChart`.
 *
 * Enquanto isto apontar para 2, o valor de `sectionImages.story[2]` em
 * event.ts é ignorado. Para voltar à imagem, troque por -1 — o arquivo
 * `public/secoes/estrategia.jpg` continua no repositório justamente para
 * isso.
 */
const CAPITULO_COM_GRAFICO = 2;

export default function ScrollStory({
  albums,
  photos,
}: {
  albums: AlbumWithPhotos[];
  /** Fotos escolhidas em `sectionImages.story`, já resolvidas na home. */
  photos?: (Photo | null)[];
}) {
  return (
    <section className="px-[22px]">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-[clamp(90px,17vh,180px)] py-[clamp(80px,15vh,160px)]">
        {eventConfig.story.map((chapter, index) => {
          const album = albums.length ? albums[index % albums.length] : null;
          const photo = photos?.[index] ?? album?.photos[1] ?? album?.cover ?? null;
          const flipped = index % 2 === 1;
          // O quadro é o mesmo para imagem e para gráfico: trocar o conteúdo
          // não pode mudar o desenho da página.
          const quadro = `aspect-[4/3] w-full rounded-[4px] border border-gold/12 md:col-span-8 md:aspect-[16/9] ${
            flipped ? "md:order-1" : "md:order-2"
          }`;

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

                {index === CAPITULO_COM_GRAFICO ? (
                  <StrategyChart className={quadro} />
                ) : (
                  <ParallaxImage
                    photo={photo}
                    src={eventConfig.sectionImages.story[index] || undefined}
                    imgClassName={STORY_FOCUS[index] ?? ""}
                    sizes="(min-width: 768px) 66vw, 100vw"
                    alt={`${chapter.word} — ${eventConfig.name}`}
                    depth={0.1 + index * 0.02}
                    className={quadro}
                  />
                )}
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
