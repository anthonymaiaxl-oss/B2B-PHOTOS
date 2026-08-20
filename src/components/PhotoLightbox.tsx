"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Download, Share2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { eventConfig } from "@/config/event";
import { downloadOne } from "@/lib/download";
import { EASE } from "@/lib/motion";
import type { Photo } from "@/types";

const SWIPE_THRESHOLD = 70;

export default function PhotoLightbox({
  photos,
  index,
  albumName,
  onIndexChange,
  onClose,
}: {
  photos: Photo[];
  index: number;
  albumName: string;
  onIndexChange: (next: number) => void;
  onClose: () => void;
}) {
  const [toast, setToast] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const photo = photos[index];

  const step = useCallback(
    (delta: number) => {
      setFailed(false);
      setToast(null);
      onIndexChange((index + delta + photos.length) % photos.length);
    },
    [index, photos.length, onIndexChange],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose, step]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const share = async () => {
    const url = typeof window === "undefined" ? "" : window.location.href;
    const payload = {
      title: eventConfig.name,
      text: `Confira as fotos do ${eventConfig.name}.`,
      url,
    };
    if (navigator.share) {
      try {
        await navigator.share(payload);
        return;
      } catch {
        /* o usuário cancelou */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setToast("LINK COPIADO");
    } catch {
      setToast("COPIE O LINK DA BARRA");
    }
  };

  const control =
    "flex items-center justify-center rounded-full border border-gold/30 text-white transition-colors duration-300 hover:border-gold hover:text-gold-bright";

  return (
    <AnimatePresence>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={`Foto ${index + 1} de ${photos.length} — ${albumName}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35, ease: EASE }}
        className="fixed inset-0 z-[100] flex flex-col bg-[#02040a]"
      >
        <div className="flex items-center justify-between px-4 py-4">
          <span className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.18em] text-muted">
            <span className="text-gold">{index + 1}</span> / {photos.length} ·{" "}
            {albumName.toUpperCase()}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className={`${control} h-12 w-12`}
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        <motion.div
          key={photo.id}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.16}
          onDragEnd={(_, info) => {
            if (info.offset.x < -SWIPE_THRESHOLD) step(1);
            else if (info.offset.x > SWIPE_THRESHOLD) step(-1);
          }}
          initial={{ opacity: 0, scale: 1.03, filter: "blur(6px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.6, ease: EASE }}
          className="relative flex min-h-0 flex-1 touch-pan-y items-center justify-center px-3.5"
        >
          {failed ? (
            <p className="text-center font-[family-name:var(--font-mono)] text-[10px] tracking-[0.18em] text-muted">
              NÃO FOI POSSÍVEL CARREGAR ESTA FOTO
            </p>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo.previewUrl}
              alt={`${albumName} — ${photo.name}`}
              onError={() => setFailed(true)}
              draggable={false}
              className="max-h-full max-w-full object-contain"
            />
          )}
        </motion.div>

        <div className="flex flex-col items-center gap-3 px-4 pb-8 pt-4">
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Foto anterior"
              className={`${control} h-[52px] w-[52px]`}
            >
              <ArrowLeft size={17} strokeWidth={1.5} />
            </button>

            <button
              type="button"
              onClick={() => {
                downloadOne(photo, albumName);
                setToast("BAIXANDO EM ALTA…");
              }}
              className="flex h-[52px] items-center gap-2 rounded-full border border-gold bg-gradient-to-b from-gold-bright to-gold px-6 font-[family-name:var(--font-mono)] text-[10px] font-bold tracking-[0.16em] text-ink transition-all duration-300 hover:from-white hover:to-gold-bright"
            >
              <Download size={15} strokeWidth={2} /> BAIXAR
            </button>

            <button
              type="button"
              onClick={share}
              className={`${control} h-[52px] gap-2 px-5 font-[family-name:var(--font-mono)] text-[10px] tracking-[0.16em]`}
            >
              <Share2 size={15} strokeWidth={1.5} /> COMPARTILHAR
            </button>

            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Próxima foto"
              className={`${control} h-[52px] w-[52px]`}
            >
              <ArrowRight size={17} strokeWidth={1.5} />
            </button>
          </div>

          <span
            aria-live="polite"
            className="h-3 font-[family-name:var(--font-mono)] text-[9px] tracking-[0.18em] text-gold"
          >
            {toast ?? ""}
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
