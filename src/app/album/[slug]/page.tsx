import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import PhotoGrid from "@/components/PhotoGrid";
import { eventConfig } from "@/config/event";
import { getAlbumPhotos, listAlbums } from "@/lib/drive";

// 10 minutos. Precisa ser um literal: o Next lê este export por análise
// estática e não resolve identificador importado (REVALIDATE_SECONDS).
export const revalidate = 600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const album = (await listAlbums()).find((item) => item.id === slug);
  if (!album) return { title: `Álbum não encontrado — ${eventConfig.brand}` };
  return {
    title: `${album.name} — ${eventConfig.name}`,
    description: `Fotos de ${album.name} no ${eventConfig.name}.`,
  };
}

export default async function AlbumPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const albums = await listAlbums();
  const album = albums.find((item) => item.id === slug);
  if (!album) notFound();

  const photos = await getAlbumPhotos(album);
  const others = albums.filter((item) => item.id !== album.id);

  return (
    <>
      <Header solid />
      <main className="relative z-[2] px-[22px] pb-24 pt-28">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-8">
          <nav
            aria-label="Navegação"
            className="flex items-center gap-2.5 font-[family-name:var(--font-mono)] text-[10px] tracking-[0.18em] text-muted"
          >
            <Link href="/" className="text-gold hover:text-gold-bright">
              INÍCIO
            </Link>
            <span aria-hidden="true">/</span>
            <span>{album.name.toUpperCase()}</span>
          </nav>

          <header className="flex flex-wrap items-end justify-between gap-5 border-b border-gold/20 pb-6">
            <div className="flex flex-col gap-2">
              {album.caption && (
                <span className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.22em] text-gold">
                  {album.caption.toUpperCase()}
                </span>
              )}
              <h1 className="m-0 text-[clamp(34px,9vw,78px)] font-extrabold leading-[0.92] tracking-[-0.04em] text-white">
                {album.name}
              </h1>
            </div>
            <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.18em] text-muted">
              {photos.length} FOTO{photos.length === 1 ? "" : "S"}
            </span>
          </header>

          {photos.length === 0 ? (
            <p className="gold-border rounded-lg bg-navy/40 py-16 text-center text-sm text-muted">
              Este álbum ainda não possui fotos.
            </p>
          ) : (
            <PhotoGrid photos={photos} albumName={album.name} />
          )}

          {others.length > 0 && (
            <section className="flex flex-col gap-4 border-t border-gold/15 pt-10">
              <span className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.2em] text-muted">
                OUTROS ÁLBUNS
              </span>
              <div className="flex flex-wrap gap-2.5">
                {others.map((other) => (
                  <Link
                    key={other.id}
                    href={`/album/${other.id}`}
                    className="flex min-h-11 items-center rounded-full border border-gold/22 px-5 text-xs tracking-[0.06em] text-muted transition-colors duration-300 hover:border-gold/70 hover:bg-gold/10 hover:text-white"
                  >
                    {other.name}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
