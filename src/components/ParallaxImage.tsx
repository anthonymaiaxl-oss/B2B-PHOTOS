"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import type { Photo } from "@/types";

/** Parallax sutil baseado na posição do elemento na viewport. */
export default function ParallaxImage({
  photo,
  alt,
  depth = 0.12,
  className = "",
  priority = false,
  src,
}: {
  photo: Photo | null;
  alt: string;
  depth?: number;
  className?: string;
  priority?: boolean;
  /** Imagem fixa de `public/`. Quando presente, tem prioridade sobre `photo`. */
  src?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const shift = 100 * depth;
  const y = useTransform(scrollYProgress, [0, 1], [`-${shift}px`, `${shift}px`]);

  const source = src || photo?.thumbnailUrl;

  return (
    <div ref={ref} className={`relative overflow-hidden bg-navy ${className}`}>
      <motion.div style={{ y }} className="absolute inset-[-12%]">
        {source && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={source}
            alt={alt}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            className="h-full w-full object-cover"
          />
        )}
      </motion.div>
    </div>
  );
}
