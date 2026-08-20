import AlbumCard from "./AlbumCard";
import Reveal from "./Reveal";
import type { AlbumWithPhotos } from "@/types";

export default function AlbumGrid({ albums }: { albums: AlbumWithPhotos[] }) {
  return (
    <section id="albuns" className="px-[22px] py-[clamp(80px,14vh,150px)]">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-9">
        <Reveal className="flex flex-col gap-3">
          <span className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.24em] text-gold">
            ÁLBUNS
          </span>
          <h2 className="m-0 text-[clamp(30px,8vw,64px)] font-extrabold leading-[0.95] tracking-[-0.035em] text-white">
            EXPLORE O <span className="text-gold-gradient">DIA INTEIRO</span>
          </h2>
        </Reveal>

        {albums.length === 0 ? (
          <p className="gold-border rounded-lg bg-navy/40 p-8 text-center text-sm text-muted">
            Nenhum álbum publicado ainda. As fotos aparecem aqui assim que a organização
            fizer o envio.
          </p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3.5">
            {albums.map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
