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
  if (photos.length === 0 || albums.length === 0) return null;

  return (
    <section className="px-[22px] pb-[clamp(80px,14vh,150px)]">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-7">
        <Reveal className="flex flex-wrap items-end justify-between gap-5">
          <h2 className="m-0 text-[clamp(26px,6vw,44px)] font-extrabold tracking-[-0.03em] text-white">
            Destaques
          </h2>
          <span className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.18em] text-gold">
            SELEÇÃO DA ORGANIZAÇÃO
          </span>
        </Reveal>

        <div className="grid auto-rows-[minmax(78px,auto)] grid-cols-6 gap-2.5 sm:auto-rows-[minmax(92px,auto)] sm:gap-3.5">
          {photos.slice(0, SPANS.length).map((photo, index) => {
            const album = albums[index % albums.length];
            return (
              <Reveal key={photo.id} className={SPANS[index]}>
                <Link
                  href={`/album/${album.id}`}
                  data-cursor="VER"
                  aria-label={`Ver o álbum ${album.name}`}
                  className="group relative block h-full w-full overflow-hidden rounded-[4px] border border-gold/10 bg-navy transition-colors duration-500 hover:border-gold/45"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.thumbnailUrl}
                    alt={`${album.name} — destaque`}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                  />
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(212,175,55,0.28),transparent_60%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
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
