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

  return (
    <section className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden px-[22px] pb-12 pt-28">
      {/* Foto de fundo, bem apagada: o protagonista é o dourado */}
      <div className="absolute inset-0 bg-navy">
        {photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo.previewUrl}
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover opacity-40 saturate-[0.7]"
            fetchPriority="high"
          />
        )}
      </div>

      <motion.div
        aria-hidden="true"
        style={{ x, y }}
        className="animate-glow absolute left-1/2 top-[6%] -ml-[340px] h-[min(92vw,680px)] w-[min(92vw,680px)] rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.28),rgba(212,175,55,0)_66%)] blur-[26px]"
      />

      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,6,14,0.88)_0%,rgba(8,18,39,0.55)_38%,rgba(4,6,14,0.9)_78%,#04060e_100%)]"
      />

      <div className="relative z-[2] mx-auto flex w-full max-w-[1180px] flex-col items-center gap-7 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, ease: EASE, delay: 0.15 }}
          className="w-[min(46vw,210px)] drop-shadow-[0_0_40px_rgba(212,175,55,0.22)]"
        >
          <EventSeal className="h-auto w-full" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.35 }}
          className="flex items-center gap-3"
        >
          <span className="h-px w-6 bg-gold/60" />
          <span className="font-[family-name:var(--font-mono)] text-[9px] tracking-[0.24em] text-gold/85 sm:text-[10px]">
            {eventConfig.hero.kicker}
          </span>
          <span className="h-px w-6 bg-gold/60" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: EASE, delay: 0.45 }}
          className="m-0 flex flex-col items-center gap-1"
        >
          <span className="text-[clamp(15px,4.6vw,30px)] font-semibold tracking-[0.34em] text-white/90">
            {eventConfig.hero.titleTop}
          </span>
          <span className="text-gold-gradient text-[clamp(34px,10.5vw,118px)] font-extrabold leading-[0.92] tracking-[-0.02em]">
            {eventConfig.hero.titleMain}
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE, delay: 0.66 }}
          className="m-0 max-w-[560px] text-[clamp(15px,3.6vw,20px)] leading-[1.45] text-white/85 text-pretty"
        >
          {eventConfig.hero.headline}{" "}
          <span className="text-muted">{eventConfig.hero.subheadline}</span>
        </motion.p>

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
