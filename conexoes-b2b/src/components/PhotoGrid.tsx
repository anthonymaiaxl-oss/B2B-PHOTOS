"use client";

import { useCallback, useState } from "react";
import { PHOTOS_PER_PAGE } from "@/config/event";
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

  const close = useCallback(() => setOpen(null), []);
  const visible = photos.slice(0, limit);

  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,220px),1fr))] gap-2.5">
        {visible.map((photo, index) => (
          <PhotoCard
            key={photo.id}
            photo={photo}
            albumName={albumName}
            priority={index < 4}
            onOpen={() => setOpen(index)}
          />
        ))}
      </div>

      {limit < photos.length && (
        <button
          type="button"
          onClick={() => setLimit((value) => value + PHOTOS_PER_PAGE)}
          className="mx-auto flex min-h-12 items-center rounded-full border border-[#26232f] px-8 font-[family-name:var(--font-plex)] text-[10px] tracking-[0.2em] transition-colors duration-300 hover:border-violet hover:bg-violet/10"
        >
          CARREGAR MAIS
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
