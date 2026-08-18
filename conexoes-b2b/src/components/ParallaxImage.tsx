"use client";

import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import type { Photo } from "@/types";

/** Parallax sutil baseado na posição do elemento na viewport. */
export default function ParallaxImage({
  photo,
  alt,
  depth = 0.12,
  className = "",
  sizes = "(max-width: 768px) 100vw, 1180px",
  priority = false,
}: {
  photo: Photo | null;
  alt: string;
  depth?: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const shift = 100 * depth;
  const y = useTransform(scrollYProgress, [0, 1], [`-${shift}px`, `${shift}px`]);

  return (
    <div ref={ref} className={`relative overflow-hidden bg-ink-soft ${className}`}>
      <motion.div style={{ y }} className="absolute inset-[-12%]">
        {photo && (
          <Image
            src={photo.thumbnailUrl}
            alt={alt}
            fill
            priority={priority}
            sizes={sizes}
            className="object-cover"
          />
        )}
      </motion.div>
    </div>
  );
}
