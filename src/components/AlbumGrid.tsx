import AlbumCard from "./AlbumCard";
import Reveal from "./Reveal";
import type { AlbumWithPhotos } from "@/types";

export default function AlbumGrid({ albums }: { albums: AlbumWithPhotos[] }) {
  return (
    <section id="albuns" className="px-[22px] py-[clamp(80px,14vh,150px)]">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-9">
        <Reveal className="flex flex-col gap-3">
          <span className="font-[family-name:var(--font-plex)] text-[10px] tracking-[0.24em] text-violet">
            ÁLBUNS
          </span>
          <h2 className="m-0 text-[clamp(32px,8.5vw,68px)] font-semibold leading-[0.95] tracking-[-0.035em]">
            EXPLORE OS MOMENTOS
          </h2>
        </Reveal>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3.5">
          {albums.map((album) => (
            <AlbumCard key={album.id} album={album} />
          ))}
        </div>
      </div>
    </section>
  );
}
