"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { photoSrc, photoSrcSet } from "@/lib/photo-src";
import type { Photo } from "@/types";

/** Parallax sutil baseado na posição do elemento na viewport. */
export default function ParallaxImage({
  photo,
  alt,
  depth = 0.12,
  className = "",
  priority = false,
  src,
  sizes = "100vw",
  imgClassName = "",
}: {
  photo: Photo | null;
  alt: string;
  depth?: number;
  className?: string;
  priority?: boolean;
  /** Imagem fixa de `public/`. Quando presente, tem prioridade sobre `photo`. */
  src?: string;
  /** Quanto da viewport a imagem ocupa — orienta a escolha do srcSet. */
  sizes?: string;
  /**
   * Classes aplicadas na `<img>`, não no quadro. Serve para o ponto de corte:
   * o bloco é 4/3 no celular e 16/9 no desktop, então uma mesma imagem é
   * cortada de formas diferentes. `object-[78%_50%] md:object-center` mantém
   * o assunto no quadro quando ele não está no meio da foto.
   */
  imgClassName?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const shift = 100 * depth;
  const y = useTransform(scrollYProgress, [0, 1], [`-${shift}px`, `${shift}px`]);

  // Imagem fixa de public/ não tem variações; foto do Drive tem.
  const source = src || (photo ? photoSrc(photo) : undefined);

  return (
    <div ref={ref} className={`relative overflow-hidden bg-navy ${className}`}>
      {/* A sobra precisa ser MAIOR que o deslocamento do parallax, senão a
          borda da imagem entra no quadro. Só que o deslocamento é de 10 a 14
          pixels, e 12% davam 30px no celular e 51px no desktop — quatro vezes
          o necessário, comendo 9,7% de cada borda de toda imagem do site.
          Era isso que obrigava a reenquadrar cada foto à mão. Com 7% sobram
          17px no celular e 30px no desktop: folga real, e o visível sobe de
          80,6% para 87,7%. */}
      <motion.div style={{ y }} className="absolute inset-[-7%]">
        {source && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={source}
            srcSet={!src && photo ? photoSrcSet(photo) : undefined}
            sizes={!src && photo ? sizes : undefined}
            alt={alt}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            className={`h-full w-full object-cover ${imgClassName}`}
          />
        )}
      </motion.div>
    </div>
  );
}
