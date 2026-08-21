"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckSquare, Download, Loader2, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { MAX_ZIP_PHOTOS, PHOTOS_PER_PAGE } from "@/config/event";
import { downloadOne, downloadZip, type ZipProgress } from "@/lib/download";
import { EASE } from "@/lib/motion";
import PhotoCard from "./PhotoCard";
import PhotoLightbox from "./PhotoLightbox";
import type { Photo } from "@/types";

export default function PhotoGrid({
  photos,
  albumName,
}: {
  photos: Photo[];
  albumName: string;
}) {
  const [limit, setLimit] = useState(PHOTOS_PER_PAGE);
  const [open, setOpen] = useState<number | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [zip, setZip] = useState<ZipProgress | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const close = useCallback(() => setOpen(null), []);
  const visible = photos.slice(0, limit);
  const selectedPhotos = useMemo(
    () => photos.filter((photo) => selected.has(photo.id)),
    [photos, selected],
  );

  const toggle = (id: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else if (next.size >= MAX_ZIP_PHOTOS) {
        setMessage(`Máximo de ${MAX_ZIP_PHOTOS} fotos por pacote.`);
        return current;
      } else next.add(id);
      setMessage(null);
      return next;
    });
  };

  const leaveSelection = () => {
    setSelecting(false);
    setSelected(new Set());
    setMessage(null);
  };

  const startZip = async () => {
    if (selectedPhotos.length === 0 || zip) return;
    setMessage(null);
    // O estado `zip` do React chega defasado aqui dentro — guardo o último
    // progresso numa variável local para saber quantas falharam.
    let last: ZipProgress | null = null;
    try {
      await downloadZip(selectedPhotos, albumName, (progress) => {
        last = progress;
        setZip(progress);
      });
      const failed = last ? (last as ZipProgress).failed : 0;
      setMessage(
        failed > 0
          ? `${failed} foto(s) não entraram no pacote. Tente baixá-las uma a uma.`
          : null,
      );
    } catch (error) {
      console.error(error);
      setMessage("Não foi possível montar o pacote. Baixe as fotos uma a uma.");
    } finally {
      window.setTimeout(() => setZip(null), 1200);
    }
  };

  const chip =
    "flex min-h-11 items-center gap-2 rounded-full border px-5 font-[family-name:var(--font-mono)] text-[10px] tracking-[0.16em] transition-colors duration-300";

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.18em] text-muted">
          {selecting
            ? `${selected.size} SELECIONADA${selected.size === 1 ? "" : "S"}`
            : "TOQUE PARA AMPLIAR · BAIXE EM ALTA"}
        </span>

        <div className="flex flex-wrap items-center gap-2.5">
          {selecting ? (
            <>
              <button
                type="button"
                onClick={() =>
                  setSelected(
                    new Set(photos.slice(0, MAX_ZIP_PHOTOS).map((photo) => photo.id)),
                  )
                }
                className={`${chip} border-gold/25 text-muted hover:border-gold/60 hover:text-white`}
              >
                MARCAR {Math.min(photos.length, MAX_ZIP_PHOTOS)}
              </button>
              <button
                type="button"
                onClick={startZip}
                disabled={selected.size === 0 || Boolean(zip)}
                className={`${chip} border-gold bg-gradient-to-b from-gold-bright to-gold font-bold text-ink disabled:cursor-not-allowed disabled:opacity-40`}
              >
                {zip ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Download size={14} strokeWidth={2} />
                )}
                {zip
                  ? zip.phase === "compactando"
                    ? "COMPACTANDO…"
                    : `${zip.done}/${zip.total}`
                  : "BAIXAR .ZIP"}
              </button>
              <button
                type="button"
                onClick={leaveSelection}
                aria-label="Sair do modo de seleção"
                className={`${chip} border-gold/25 text-muted hover:border-gold/60 hover:text-white`}
              >
                <X size={14} strokeWidth={1.8} />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setSelecting(true)}
              className={`${chip} border-gold/25 text-gold hover:border-gold/70 hover:text-gold-bright`}
            >
              <CheckSquare size={14} strokeWidth={1.8} />
              SELECIONAR VÁRIAS
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {message && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            role="status"
            className="m-0 rounded-md border border-gold/25 bg-navy/50 px-4 py-2.5 text-[13px] text-gold-bright"
          >
            {message}
          </motion.p>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,240px),1fr))] gap-2.5 sm:gap-3.5">
        {visible.map((photo, index) => (
          <PhotoCard
            key={photo.id}
            photo={photo}
            albumName={albumName}
            priority={index < 4}
            selecting={selecting}
            selected={selected.has(photo.id)}
            onOpen={() => setOpen(index)}
            onDownload={() => downloadOne(photo, albumName)}
            onToggleSelect={() => toggle(photo.id)}
          />
        ))}
      </div>

      {limit < photos.length && (
        <button
          type="button"
          onClick={() => setLimit((value) => value + PHOTOS_PER_PAGE)}
          className="mx-auto flex min-h-12 items-center rounded-full border border-gold/25 px-8 font-[family-name:var(--font-mono)] text-[10px] tracking-[0.2em] text-muted transition-colors duration-300 hover:border-gold/70 hover:bg-gold/10 hover:text-white"
        >
          CARREGAR MAIS ({photos.length - limit})
        </button>
      )}

      {open !== null && (
        <PhotoLightbox
          photos={photos}
          index={open}
          albumName={albumName}
          onIndexChange={setOpen}
          onClose={close}
        />
      )}
    </>
  );
}
