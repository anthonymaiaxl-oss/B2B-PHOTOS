"use client";

import Image from "next/image";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { useEffect } from "react";
import { eventConfig } from "@/config/event";
import { EASE } from "@/lib/motion";
import type { Photo } from "@/types";

export default function Hero({ photo }: { photo: Photo | null }) {
  const reduced = useReducedMotion();
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, { stiffness: 40, damping: 18 });
  const y = useSpring(rawY, { stiffness: 40, damping: 18 });

  useEffect(() => {
    if (reduced) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const onMove = (event: MouseEvent) => {
      rawX.set((event.clientX / window.innerWidth - 0.5) * 60);
      rawY.set((event.clientY / window.innerHeight - 0.5) * 40);
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

  return (
    <section className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden px-[22px] pb-12">
      <div className="absolute inset-0 bg-ink-soft">
        {photo && (
          <Image
            src={photo.previewUrl}
            alt={`${eventConfig.name} — abertura do evento`}
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-70"
          />
        )}
      </div>

      <motion.div
        aria-hidden="true"
        style={{ x, y }}
        className="animate-glow absolute left-1/2 top-[8%] -ml-[360px] h-[min(90vw,720px)] w-[min(90vw,720px)] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.42),rgba(139,92,246,0)_66%)] blur-[30px]"
      />

      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,9,0.72)_0%,rgba(5,5,9,0.25)_38%,rgba(5,5,9,0.86)_76%,#050509_100%)]"
      />

      <div className="relative mx-auto flex w-full max-w-[1180px] flex-col gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.2 }}
          className="flex items-center gap-3"
        >
          <span className="h-px w-6 bg-violet" />
          <span className="font-[family-name:var(--font-plex)] text-[10px] tracking-[0.24em] text-muted">
            {eventConfig.hero.kicker}
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: EASE, delay: 0.35 }}
          className="m-0 text-[clamp(58px,17vw,190px)] font-semibold leading-[0.88] tracking-[-0.03em]"
        >
          CONEXÕES
          <br />
          <span className="text-transparent [-webkit-text-stroke:1px_rgba(255,255,255,0.55)]">
            B2B
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE, delay: 0.62 }}
          className="m-0 max-w-[520px] text-[clamp(17px,4.4vw,26px)] leading-[1.25] tracking-[-0.01em] text-pretty"
        >
          {eventConfig.hero.headline}
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE, delay: 0.78 }}
          className="m-0 max-w-[430px] text-sm leading-relaxed text-muted text-pretty"
        >
          {eventConfig.hero.subheadline}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE, delay: 0.95 }}
          className="flex flex-wrap items-center gap-5"
        >
          <button
            type="button"
            onClick={scrollToAlbums}
            data-cursor="→"
            aria-label="Explorar fotos do evento"
            className="min-h-[52px] rounded-full border border-violet-bright/45 bg-violet/10 px-8 text-xs font-semibold tracking-[0.2em] transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-bright hover:bg-violet/25"
          >
            {eventConfig.hero.cta}
          </button>
          <span className="flex flex-col items-center gap-1.5 text-[#5b5768]">
            <span className="font-[family-name:var(--font-plex)] text-[9px] tracking-[0.2em]">
              SCROLL
            </span>
            <span className="animate-bob block h-6 w-px bg-gradient-to-b from-violet to-transparent" />
          </span>
        </motion.div>
      </div>
    </section>
  );
}
