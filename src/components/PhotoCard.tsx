"use client";

import { motion } from "framer-motion";
import { Check, Download } from "lucide-react";
import { revealVariants, viewportOnce } from "@/lib/motion";
import type { Photo } from "@/types";

export default function PhotoCard({
  photo,
  albumName,
  onOpen,
  onDownload,
  onToggleSelect,
  selecting = false,
  selected = false,
  priority = false,
}: {
  photo: Photo;
  albumName: string;
  onOpen: () => void;
  onDownload: () => void;
  onToggleSelect: () => void;
  selecting?: boolean;
  selected?: boolean;
  priority?: boolean;
}) {
  const tall = photo.height && photo.width ? photo.height > photo.width : false;

  return (
    <motion.div
      variants={revealVariants}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      className="group relative"
    >
      <button
        type="button"
        onClick={selecting ? onToggleSelect : onOpen}
        data-cursor={selecting ? (selected ? "TIRAR" : "PEGAR") : "VER"}
        aria-label={
          selecting
            ? `${selected ? "Desmarcar" : "Marcar"} a foto ${photo.name}`
            : `Abrir a foto ${photo.name} de ${albumName}`
        }
        aria-pressed={selecting ? selected : undefined}
        className={`relative block w-full overflow-hidden rounded-[4px] border bg-navy transition-colors duration-300 ${
          tall ? "aspect-[4/5]" : "aspect-[4/3]"
        } ${selected ? "border-gold" : "border-gold/10 hover:border-gold/45"}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.thumbnailUrl}
          alt={`${albumName} — ${photo.name}`}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className={`h-full w-full object-cover transition-all duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105 ${
            selecting && !selected ? "opacity-60" : "opacity-100"
          }`}
        />

        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,rgba(4,6,14,0.75))] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />

        {selecting && (
          <span
            aria-hidden="true"
            className={`absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full border transition-all duration-200 ${
              selected
                ? "border-gold bg-gold text-ink"
                : "border-white/60 bg-ink/50 text-transparent"
            }`}
          >
            <Check size={15} strokeWidth={3} />
          </span>
        )}
      </button>

      {/* No toque não existe hover: no celular o botão de baixar fica sempre visível. */}
      {!selecting && (
        <button
          type="button"
          onClick={onDownload}
          data-cursor="•"
          aria-label={`Baixar a foto ${photo.name}`}
          className="absolute bottom-2.5 right-2.5 flex h-10 w-10 items-center justify-center rounded-full border border-gold/40 bg-ink/70 text-gold-bright backdrop-blur-sm transition-all duration-300 hover:border-gold hover:bg-gold hover:text-ink focus-visible:opacity-100 md:opacity-0 md:group-hover:opacity-100"
        >
          <Download size={15} strokeWidth={1.8} />
        </button>
      )}
    </motion.div>
  );
}
