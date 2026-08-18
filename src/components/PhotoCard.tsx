"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { revealVariants, viewportOnce } from "@/lib/motion";
import type { Photo } from "@/types";

export default function PhotoCard({
  photo,
  albumName,
  onOpen,
  priority = false,
}: {
  photo: Photo;
  albumName: string;
  onOpen: () => void;
  priority?: boolean;
}) {
  const tall = photo.height && photo.width ? photo.height > photo.width : false;

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      data-cursor="VER"
      aria-label={`Abrir foto ${photo.name} de ${albumName}`}
      variants={revealVariants}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      className={`group relative w-full overflow-hidden rounded-[3px] bg-ink-soft ${
        tall ? "aspect-[4/5]" : "aspect-[4/3]"
      }`}
    >
      <Image
        src={photo.thumbnailUrl}
        alt={`${albumName} — ${photo.name}`}
        fill
        priority={priority}
        sizes="(max-width: 640px) 50vw, 300px"
        className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
      />
    </motion.button>
  );
}
