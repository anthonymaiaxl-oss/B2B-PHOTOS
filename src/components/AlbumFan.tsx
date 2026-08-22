"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { animate, motion, useMotionValue, useTransform, type MotionValue } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AlbumWithPhotos } from "@/types";

/**
 * Os álbuns em leque, arrastáveis com o dedo.
 *
 * Substitui a grade de 4 colunas nos DOIS tamanhos. O card do meio fica ereto
 * e na frente; os vizinhos giram, recuam e escurecem. Arrastar move o leque,
 * tocar num card lateral traz ele para o centro, e tocar no card central abre
 * o álbum.
 *
 * Por que motion values e não estado do React: durante o arrasto a posição
 * muda a cada evento de ponteiro. Guardar isso em `useState` re-renderizaria
 * a lista inteira dezenas de vezes por segundo. `useMotionValue` escreve
 * direto no transform, fora do ciclo do React — o estado só é tocado quando o
 * álbum central de fato muda, para atualizar o nome embaixo.
 *
 * `touch-action: pan-y` no palco é o que impede o bug clássico deste tipo de
 * componente no celular: sem isso o arrasto horizontal engole a rolagem
 * vertical e a pessoa fica presa na seção.
 */

/** Quantos cards aparecem de cada lado antes de sumir. */
const VIZINHOS = 3;

/**
 * Distância que o dedo percorre para virar um card. É maior que o passo
 * visual de propósito: o card anda pouco (é leque, não fileira), mas exigir
 * só 58px de arrasto para trocar de álbum deixaria o gesto nervoso.
 */
const passoDoDedo = (larguraCard: number) => larguraCard * 0.58;

/** Quanto o card anda para o lado por posição de distância do centro. */
const passoVisual = (larguraCard: number) => larguraCard * 0.3;

/**
 * Deslocamento horizontal do card, comprimido conforme se afasta.
 *
 * Sem a compressão o leque vira fileira: com 5 álbuns num celular de 390px os
 * cards chegavam a x=739 e saíam pela borda. Num leque real as cartas de trás
 * ficam cada vez mais juntas — o primeiro vizinho anda um passo inteiro, os
 * seguintes andam 45% disso.
 */
function deslocX(d: number, larguraCard: number) {
  const abs = Math.abs(d);
  const comprimido = Math.min(abs, 1) + Math.max(abs - 1, 0) * 0.45;
  return Math.sign(d) * comprimido * passoVisual(larguraCard);
}

/** Acima disto o gesto foi arrasto, não toque — não abre o álbum. */
const LIMIAR_TOQUE = 8;

const limita = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

function Card({
  album,
  indice,
  progresso,
  larguraCard,
  ativo,
  abrindo,
  onSelecionar,
}: {
  album: AlbumWithPhotos;
  indice: number;
  progresso: MotionValue<number>;
  larguraCard: number;
  ativo: boolean;
  abrindo: boolean;
  onSelecionar: (indice: number) => boolean;
}) {
  // Distância deste card até o centro do leque. Fracionária durante o arrasto,
  // que é o que faz o movimento acompanhar o dedo em vez de pular de card.
  const desloc = useTransform(progresso, (p) => indice - p);

  const x = useTransform(desloc, (d) => deslocX(d, larguraCard));
  const y = useTransform(desloc, (d) => Math.min(Math.abs(d), VIZINHOS) ** 1.15 * 20);
  const rotate = useTransform(desloc, (d) => limita(d, -VIZINHOS, VIZINHOS) * 8);
  const scale = useTransform(desloc, (d) => 1 - Math.min(Math.abs(d), VIZINHOS) * 0.06);
  const opacity = useTransform(desloc, (d) => (Math.abs(d) > VIZINHOS + 0.4 ? 0 : 1));
  const zIndex = useTransform(desloc, (d) => 100 - Math.round(Math.abs(d) * 10));
  // Os laterais escurecem: é o que faz o do meio ler como "o selecionado".
  const veu = useTransform(desloc, (d) => Math.min(Math.abs(d), VIZINHOS) * 0.22);

  return (
    <motion.div
      style={{
        x,
        y,
        rotate,
        scale,
        opacity,
        zIndex,
        width: larguraCard,
        // Centraliza o card no palco. Em px porque a largura é medida em px;
        // `left-1/2` sozinho alinharia a borda esquerda, não o centro.
        marginLeft: -larguraCard / 2,
      }}
      className="absolute left-1/2 top-0 origin-bottom"
    >
      <motion.div
        animate={abrindo && ativo ? { scale: 1.14, opacity: 0 } : { scale: 1, opacity: 1 }}
        transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
      >
        <Link
          href={`/album/${album.id}`}
          data-cursor="VER"
          aria-label={`Abrir o álbum ${album.name} com ${album.photos.length} fotos`}
          tabIndex={ativo ? 0 : -1}
          onClick={(e) => {
            // Card lateral não navega: primeiro vem para o centro. Arrasto
            // também não navega — quem decide é `onSelecionar`.
            if (!onSelecionar(indice)) e.preventDefault();
          }}
          className={`relative block aspect-[4/5] w-full overflow-hidden rounded-[4px] border bg-navy transition-colors duration-500 ${
            ativo ? "gold-edge border-gold/45" : "border-gold/15"
          }`}
        >
          {album.cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={album.cover.thumbnailUrl}
              alt=""
              loading="lazy"
              decoding="async"
              draggable={false}
              className="h-full w-full select-none object-cover"
            />
          ) : (
            <span className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_0%,#0d1c3d,#04060e)]" />
          )}
          <motion.span
            aria-hidden="true"
            style={{ opacity: veu }}
            className="absolute inset-0 bg-ink"
          />
        </Link>
      </motion.div>
    </motion.div>
  );
}

export default function AlbumFan({ albums }: { albums: AlbumWithPhotos[] }) {
  const router = useRouter();
  const palco = useRef<HTMLDivElement>(null);
  const progresso = useMotionValue(0);

  const [larguraCard, setLarguraCard] = useState(240);
  const [ativo, setAtivo] = useState(0);
  const [abrindo, setAbrindo] = useState(false);

  // O leque precisa da largura real para calcular o passo do arrasto. Medir no
  // cliente e reagir a rotação de tela é mais confiável que adivinhar por
  // media query — o mesmo componente serve celular e desktop.
  useEffect(() => {
    const alvo = palco.current;
    if (!alvo) return;
    const medir = () => {
      const l = alvo.clientWidth;
      setLarguraCard(Math.round(limita(l * 0.56, 170, 290)));
    };
    medir();
    const obs = new ResizeObserver(medir);
    obs.observe(alvo);
    return () => obs.disconnect();
  }, []);

  // O nome embaixo só muda quando o card central muda — não a cada pixel.
  useEffect(() => {
    return progresso.on("change", (p) => {
      const i = limita(Math.round(p), 0, albums.length - 1);
      setAtivo((anterior) => (anterior === i ? anterior : i));
    });
  }, [progresso, albums.length]);

  const irPara = useCallback(
    (i: number) => {
      const destino = limita(i, 0, albums.length - 1);
      animate(progresso, destino, { type: "spring", stiffness: 260, damping: 30 });
    },
    [albums.length, progresso],
  );

  // --------------------------------------------------------------- arrasto
  const gesto = useRef({ ativo: false, x0: 0, p0: 0, andou: 0, t0: 0 });

  const aoPressionar = (e: React.PointerEvent) => {
    gesto.current = { ativo: true, x0: e.clientX, p0: progresso.get(), andou: 0, t0: performance.now() };
    try {
      // Captura garante que o arrasto continue mesmo se o dedo sair do palco.
      // Pode falhar se o ponteiro já foi liberado pelo navegador — nesse caso
      // o gesto ainda funciona dentro do elemento, só não persegue para fora.
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* segue sem captura */
    }
  };

  const aoMover = (e: React.PointerEvent) => {
    const g = gesto.current;
    if (!g.ativo) return;
    const dx = e.clientX - g.x0;
    g.andou = Math.max(g.andou, Math.abs(dx));
    const cru = g.p0 - dx / passoDoDedo(larguraCard);
    // Resistência nas pontas: deixa passar um pouco e puxa de volta, para o
    // leque não parecer travado quando chega ao fim.
    const min = 0;
    const max = albums.length - 1;
    const p = cru < min ? min + (cru - min) * 0.35 : cru > max ? max + (cru - max) * 0.35 : cru;
    progresso.set(p);
  };

  const aoSoltar = (e: React.PointerEvent) => {
    const g = gesto.current;
    if (!g.ativo) return;
    g.ativo = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* o ponteiro já pode ter sido liberado pelo navegador */
    }
    const dx = e.clientX - g.x0;
    const dt = Math.max(performance.now() - g.t0, 1);
    const velocidade = dx / dt; // px por ms
    // Movimento rápido e curto conta como "joguei para o lado".
    const empurrao = Math.abs(velocidade) > 0.45 ? -Math.sign(velocidade) : 0;
    irPara(Math.round(progresso.get()) + empurrao);
  };

  /** Devolve true quando o clique deve mesmo abrir o álbum. */
  const aoSelecionar = useCallback(
    (i: number) => {
      if (gesto.current.andou > LIMIAR_TOQUE) return false;
      if (i !== Math.round(progresso.get())) {
        irPara(i);
        return false;
      }
      // É o card central e foi um toque limpo: anima a abertura e navega.
      setAbrindo(true);
      window.setTimeout(() => router.push(`/album/${albums[i].id}`), 360);
      return false;
    },
    [albums, irPara, progresso, router],
  );

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") irPara(Math.round(progresso.get()) + 1);
      if (e.key === "ArrowLeft") irPara(Math.round(progresso.get()) - 1);
    };
    const alvo = palco.current;
    alvo?.addEventListener("keydown", aoTeclar);
    return () => alvo?.removeEventListener("keydown", aoTeclar);
  }, [irPara, progresso]);

  const alturaPalco = Math.round(larguraCard * 1.25) + 34;
  const atual = albums[ativo];

  return (
    <div className="flex flex-col gap-7">
      <div
        ref={palco}
        role="group"
        aria-roledescription="carrossel"
        aria-label="Álbuns do evento"
        tabIndex={0}
        onPointerDown={aoPressionar}
        onPointerMove={aoMover}
        onPointerUp={aoSoltar}
        onPointerCancel={aoSoltar}
        style={{
          height: alturaPalco,
          // `pan-y` deixa a rolagem vertical da página passar. Sem isto o
          // arrasto horizontal engole o scroll e prende a pessoa na seção.
          touchAction: "pan-y",
        }}
        className="relative w-full cursor-grab select-none active:cursor-grabbing"
      >
        {albums.map((album, i) => (
          <Card
            key={album.id}
            album={album}
            indice={i}
            progresso={progresso}
            larguraCard={larguraCard}
            ativo={i === ativo}
            abrindo={abrindo}
            onSelecionar={aoSelecionar}
          />
        ))}
      </div>

      {/* O nome fica embaixo, menor, e troca junto com o card central. */}
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="min-h-[46px]">
          <p className="m-0 text-[17px] font-bold leading-tight text-white">{atual?.name}</p>
          <p className="m-0 mt-1 font-[family-name:var(--font-mono)] text-[10px] tracking-[0.2em] text-gold/80">
            {atual?.photos.length ?? 0} FOTOS
          </p>
        </div>

        <div className="flex items-center gap-2">
          {albums.map((album, i) => (
            <button
              key={album.id}
              type="button"
              onClick={() => irPara(i)}
              aria-label={`Ir para o álbum ${album.name}`}
              aria-current={i === ativo}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === ativo ? "w-6 bg-gold" : "w-1.5 bg-gold/30 hover:bg-gold/60"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
