"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { CSSProperties } from "react";
import { revealVariants, viewportOnce } from "@/lib/motion";
import type { AlbumWithPhotos } from "@/types";

export default function AlbumCard({
  album,
  index = 0,
}: {
  album: AlbumWithPhotos;
  /** Posição na grade. Serve só para defasar o fio de luz da borda: os cards
   *  ficam lado a lado e, em sincronia, o efeito viraria pisca-pisca. */
  index?: number;
}) {
  return (
    <motion.div
      variants={revealVariants}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
    >
      <Link
        href={`/album/${album.id}`}
        data-cursor="VER"
        aria-label={`Abrir o álbum ${album.name} com ${album.photos.length} fotos`}
        style={{ "--edge-delay": `${(index * -2.5).toFixed(1)}s` } as CSSProperties}
        className="gold-edge gold-sheen group relative block aspect-[4/5] overflow-hidden rounded-[4px] border border-gold/15 bg-navy transition-colors duration-500 hover:border-gold/55"
      >
        {album.cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={album.cover.thumbnailUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110"
          />
        )}

        <span
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,6,14,0)_28%,rgba(4,6,14,0.55)_62%,rgba(4,6,14,0.95)_100%)]"
        />
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_50%_92%,rgba(212,175,55,0.32),transparent_62%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        />

        {/* Filete dourado que corre no topo do card ao passar o mouse. */}
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-gradient-to-r from-transparent via-gold-bright to-transparent transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100"
        />

        <span className="absolute inset-x-[18px] bottom-[18px] flex flex-col gap-1.5 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-1.5">
          <span className="text-[19px] font-semibold tracking-[-0.01em] text-white">
            {album.name}
          </span>
          <span className="flex items-center gap-2 font-[family-name:var(--font-mono)] text-[10px] tracking-[0.18em] text-gold">
            {album.photos.length} FOTOS
            {album.caption && (
              <span className="text-muted opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                · {album.caption.toUpperCase()}
              </span>
            )}
          </span>
        </span>
      </Link>
    </motion.div>
  );
}
