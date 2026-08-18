"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { revealVariants, viewportOnce } from "@/lib/motion";
import type { AlbumWithPhotos } from "@/types";

export default function AlbumCard({ album }: { album: AlbumWithPhotos }) {
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
        aria-label={`Abrir álbum ${album.name} com ${album.photos.length} fotos`}
        className="group relative block aspect-[4/5] overflow-hidden rounded-[3px] bg-ink-soft"
      >
        {album.cover && (
          <Image
            src={album.cover.thumbnailUrl}
            alt={album.name}
            fill
            sizes="(max-width: 768px) 100vw, 360px"
            className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110"
          />
        )}
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,9,0)_30%,rgba(5,5,9,0.9)_100%)]"
        />
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_50%_90%,rgba(139,92,246,0.35),transparent_60%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        />
        <span className="absolute inset-x-[18px] bottom-[18px] flex flex-col gap-1.5 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-1.5">
          <span className="text-xl font-semibold tracking-[-0.01em]">{album.name}</span>
          <span className="font-[family-name:var(--font-plex)] text-[10px] tracking-[0.18em] text-violet-bright opacity-0 transition-opacity duration-500 group-hover:opacity-100">
            {album.photos.length} FOTOS
          </span>
        </span>
      </Link>
    </motion.div>
  );
}
