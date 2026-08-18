import Image from "next/image";
import Link from "next/link";
import Reveal from "./Reveal";
import type { AlbumWithPhotos, Photo } from "@/types";

const SPANS = [
  "col-span-6 row-span-4",
  "col-span-2 row-span-3",
  "col-span-4 row-span-3",
  "col-span-3 row-span-3",
  "col-span-3 row-span-3",
  "col-span-4 row-span-4",
  "col-span-2 row-span-4",
];

export default function HighlightGallery({
  photos,
  albums,
}: {
  photos: Photo[];
  albums: AlbumWithPhotos[];
}) {
  if (photos.length === 0) return null;

  return (
    <section className="px-[22px] pb-[clamp(80px,14vh,150px)]">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-7">
        <Reveal className="flex flex-wrap items-end justify-between gap-5">
          <h2 className="m-0 text-[clamp(26px,6vw,44px)] font-semibold tracking-[-0.03em]">
            Destaques
          </h2>
          <span className="font-[family-name:var(--font-plex)] text-[10px] tracking-[0.18em] text-muted">
            SELEÇÃO EDITORIAL
          </span>
        </Reveal>
        <div className="grid auto-rows-[minmax(78px,auto)] grid-cols-6 gap-2.5">
          {photos.slice(0, SPANS.length).map((photo, index) => {
            const album = albums[index % albums.length];
            return (
              <Reveal key={photo.id} className={SPANS[index]}>
                <Link
                  href={`/album/${album.id}`}
                  data-cursor="VER"
                  aria-label={`Ver álbum ${album.name}`}
                  className="group relative block h-full w-full overflow-hidden rounded-[3px] bg-ink-soft"
                >
                  <Image
                    src={photo.thumbnailUrl}
                    alt={`${album.name} — destaque`}
                    fill
                    sizes="(max-width: 768px) 100vw, 600px"
                    className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                  />
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
