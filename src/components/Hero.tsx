"use client";

import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { useEffect } from "react";
import { eventConfig } from "@/config/event";
import { EASE } from "@/lib/motion";
import EventSeal from "./EventSeal";
import PartnerRow from "./PartnerRow";
import type { Photo } from "@/types";

export default function Hero({ photo }: { photo: Photo | null }) {
  const reduced = useReducedMotion();
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, { stiffness: 40, damping: 18 });
  const y = useSpring(rawY, { stiffness: 40, damping: 18 });

  useEffect(() => {
    if (reduced) return;
    // Parallax de mouse só faz sentido em ponteiro fino: no celular seria
    // peso de processamento sem nenhum efeito visível.
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const onMove = (event: MouseEvent) => {
      rawX.set((event.clientX / window.innerWidth - 0.5) * 50);
      rawY.set((event.clientY / window.innerHeight - 0.5) * 34);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [rawX, rawY, reduced]);

  const scrollToAlbums = () => {
    const target = document.getElementById("albuns");
    if (!target) return;
    window.scrollTo({
      top: target.getBoundingClientRect().top + window.scrollY - 60,
      behavior: reduced ? "auto" : "smooth",
    });
  };

  const meta = [eventConfig.date, eventConfig.location].filter(Boolean).join(" · ");

  // Imagem fixa de `public/` quando configurada; senão, a capa real do Drive.
  const heroImage = eventConfig.sectionImages.hero || photo?.previewUrl;

  return (
    <section className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden px-[22px] pb-12 pt-24 sm:pt-28">
      {/* ---------------------------------------------------- fotografia de fundo */}
      <div className="absolute inset-0 bg-navy">
        {heroImage && (
          <motion.div
            className="h-full w-full"
            initial={{ scale: 1.06 }}
            // Zoom lentíssimo (ken burns). Um transform puro: não repinta layout
            // e o navegador resolve na GPU.
            animate={reduced ? { scale: 1.06 } : { scale: 1.14 }}
            transition={{ duration: 26, ease: "linear" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroImage}
              alt=""
              aria-hidden="true"
              className="h-full w-full object-cover opacity-[0.34] saturate-[0.65]"
              fetchPriority="high"
            />
          </motion.div>
        )}
      </div>

      {/* Brilho dourado que segue o mouse de longe. */}
      <motion.div
        aria-hidden="true"
        style={{ x, y }}
        className="animate-glow absolute left-1/2 top-[4%] -ml-[340px] h-[min(92vw,680px)] w-[min(92vw,680px)] rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.26),rgba(212,175,55,0)_66%)] blur-[26px]"
      />

      {/* Duas camadas de escurecimento: gradiente vertical para a leitura do
          texto + vinheta radial para dar profundidade de cinema às bordas. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,6,14,0.9)_0%,rgba(8,18,39,0.5)_38%,rgba(4,6,14,0.92)_78%,#04060e_100%)]"
      />
      <div aria-hidden="true" className="vignette absolute inset-0" />

      <div className="relative z-[2] mx-auto flex w-full max-w-[1180px] flex-col items-center gap-6 text-center sm:gap-7">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, ease: EASE, delay: 0.15 }}
          className="w-[min(42vw,190px)] drop-shadow-[0_0_40px_rgba(212,175,55,0.22)]"
        >
          <EventSeal className="h-auto w-full" />
        </motion.div>

        {/* A marca vem primeiro: a identidade do site é B2B CONEXÕES. */}
        <motion.span
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.28 }}
          className="text-[11px] font-bold tracking-[0.44em] text-white/95 sm:text-[13px]"
        >
          {eventConfig.brand.toUpperCase()}
        </motion.span>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.38 }}
          className="flex items-center gap-3"
        >
          <span className="h-px w-6 bg-gold/60 sm:w-10" />
          <span className="font-[family-name:var(--font-mono)] text-[9px] tracking-[0.24em] text-gold/85 sm:text-[10px]">
            {eventConfig.hero.kicker}
          </span>
          <span className="h-px w-6 bg-gold/60 sm:w-10" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: EASE, delay: 0.48 }}
          className="m-0 flex flex-col items-center gap-1"
        >
          <span className="text-[clamp(15px,4.6vw,30px)] font-semibold tracking-[0.34em] text-white/90">
            {eventConfig.hero.titleTop}
          </span>
          {/* pb-[0.08em] evita que o recorte do degradê corte a base das letras
              e dos acentos em telas de alta densidade. */}
          <span className="text-gold-gradient block pb-[0.08em] text-[clamp(34px,10.5vw,118px)] font-extrabold leading-[0.95] tracking-[-0.02em]">
            {eventConfig.hero.titleMain}
          </span>
        </motion.h1>

        {/*
          "Prepare-se para o novo cenário." saiu de dentro do selo — onde não
          cabia e aparecia cortada — e virou este bloco, com filete dourado e
          espaço próprio. A frase é a promessa do evento: merece uma linha só
          para ela.
        */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE, delay: 0.64 }}
          className="flex w-full max-w-[620px] flex-col items-center gap-4"
        >
          <span aria-hidden="true" className="gold-rule w-[min(70%,220px)]" />
          <p className="m-0 text-[clamp(17px,4.4vw,26px)] font-light leading-[1.25] tracking-[-0.01em] text-white text-balance">
            {eventConfig.hero.headline}
          </p>
          <p className="m-0 max-w-[520px] text-[clamp(13px,3.2vw,15px)] leading-[1.6] text-muted text-pretty">
            {eventConfig.hero.subheadline}
          </p>
        </motion.div>

        {meta && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.78 }}
            className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.2em] text-muted"
          >
            {meta.toUpperCase()}
          </motion.span>
        )}

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE, delay: 0.88 }}
          className="flex flex-col items-center gap-6"
        >
          <button
            type="button"
            onClick={scrollToAlbums}
            data-cursor="→"
            aria-label="Ver as fotos do evento"
            className="gold-sheen gold-border min-h-[54px] rounded-full bg-gradient-to-b from-gold/20 to-gold/5 px-9 text-[11px] font-bold tracking-[0.22em] text-gold-bright transition-all duration-300 hover:-translate-y-0.5 hover:border-gold-bright/70 hover:text-white"
          >
            {eventConfig.hero.cta}
          </button>

          <span className="flex flex-col items-center gap-1.5 text-[#57618a]">
            <span className="font-[family-name:var(--font-mono)] text-[9px] tracking-[0.2em]">
              ROLE
            </span>
            <span className="animate-bob block h-6 w-px bg-gradient-to-b from-gold to-transparent" />
          </span>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, ease: EASE, delay: 1.1 }}
        className="relative z-[2] mx-auto mt-10 w-full max-w-[1180px] border-t border-gold/12 pt-7"
      >
        <PartnerRow />
      </motion.div>
    </section>
  );
}
