"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Download, Share2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
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
    const timer = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const share = async () => {
    const url = typeof window === "undefined" ? "" : window.location.href;
    const payload = {
      title: "Conexões B2B",
      text: "Confira essa foto do Conexões B2B.",
      url,
    };
    if (navigator.share) {
      try {
        await navigator.share(payload);
        return;
      } catch {
        /* usuário cancelou */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setToast("LINK COPIADO");
    } catch {
      setToast("COPIE O LINK DA BARRA");
    }
  };

  const download = () => {
    try {
      const anchor = document.createElement("a");
      anchor.href = photo.downloadUrl;
      anchor.download = `${albumName}-${photo.name}.jpg`;
      anchor.rel = "noopener";
      anchor.target = "_blank";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setToast("BAIXANDO…");
    } catch {
      window.open(photo.downloadUrl, "_blank", "noopener");
      setToast("ABERTO EM NOVA ABA");
    }
  };

  const control =
    "flex items-center justify-center rounded-full border border-[#26232f] text-white transition-colors duration-300 hover:border-violet";

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
        className="fixed inset-0 z-[100] flex flex-col bg-black"
      >
        <div className="flex items-center justify-between px-4 py-4">
          <span className="font-[family-name:var(--font-plex)] text-[10px] tracking-[0.18em] text-muted">
            {index + 1} / {photos.length} · {albumName.toUpperCase()}
          </span>
          <button type="button" onClick={onClose} aria-label="Fechar" className={`${control} h-12 w-12`}>
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
          className="relative min-h-0 flex-1 touch-pan-y px-3.5"
        >
          {failed ? (
            <div className="flex h-full items-center justify-center text-center font-[family-name:var(--font-plex)] text-[10px] tracking-[0.18em] text-muted">
              NÃO FOI POSSÍVEL CARREGAR ESTA FOTO
            </div>
          ) : (
            <Image
              src={photo.previewUrl}
              alt={`${albumName} — ${photo.name}`}
              fill
              priority
              sizes="100vw"
              onError={() => setFailed(true)}
              className="object-contain"
            />
          )}
        </motion.div>

        <div className="flex flex-col items-center gap-3 px-4 pb-8 pt-4">
          <div className="flex items-center justify-center gap-2.5">
            <button type="button" onClick={() => step(-1)} aria-label="Foto anterior" className={`${control} h-[52px] w-[52px]`}>
              <ArrowLeft size={17} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={download}
              className={`${control} h-[52px] gap-2 px-5 font-[family-name:var(--font-plex)] text-[10px] tracking-[0.16em]`}
            >
              <Download size={15} strokeWidth={1.5} /> BAIXAR
            </button>
            <button
              type="button"
              onClick={share}
              className={`${control} h-[52px] gap-2 px-5 font-[family-name:var(--font-plex)] text-[10px] tracking-[0.16em]`}
            >
              <Share2 size={15} strokeWidth={1.5} /> COMPARTILHAR
            </button>
            <button type="button" onClick={() => step(1)} aria-label="Próxima foto" className={`${control} h-[52px] w-[52px]`}>
              <ArrowRight size={17} strokeWidth={1.5} />
            </button>
          </div>
          <span
            aria-live="polite"
            className="h-3 font-[family-name:var(--font-plex)] text-[9px] tracking-[0.18em] text-violet-bright"
          >
            {toast ?? ""}
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
