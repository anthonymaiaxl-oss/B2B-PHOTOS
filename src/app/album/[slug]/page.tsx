import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import PhotoGrid from "@/components/PhotoGrid";
import { REVALIDATE_SECONDS, eventConfig } from "@/config/event";
import { getAlbumPhotos } from "@/lib/google-drive";

export const revalidate = REVALIDATE_SECONDS;

export function generateStaticParams() {
  return eventConfig.albums.map((album) => ({ slug: album.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const album = eventConfig.albums.find((a) => a.id === slug);
  if (!album) return { title: "Álbum não encontrado — Conexões B2B" };
  return {
    title: `${album.name} — Conexões B2B`,
    description: `Fotos de ${album.name} no ${eventConfig.name}.`,
  };
}

export default async function AlbumPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const album = eventConfig.albums.find((a) => a.id === slug);
  if (!album) notFound();

  const photos = await getAlbumPhotos(album.id);
  const others = eventConfig.albums.filter((a) => a.id !== album.id);

  return (
    <>
      <Header solid />
      <main className="px-[22px] pb-24 pt-24">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-8">
          <nav
            aria-label="Navegação"
            className="flex items-center gap-2.5 font-[family-name:var(--font-plex)] text-[10px] tracking-[0.18em] text-muted"
          >
            <Link href="/" className="text-violet-bright hover:text-white">
              HOME
            </Link>
            <span aria-hidden="true">/</span>
            <span>{album.name.toUpperCase()}</span>
          </nav>

          <header className="flex flex-wrap items-end justify-between gap-5 border-b border-line pb-6">
            <h1 className="m-0 text-[clamp(36px,10vw,84px)] font-semibold leading-[0.92] tracking-[-0.04em]">
              {album.name}
            </h1>
            <span className="font-[family-name:var(--font-plex)] text-[11px] tracking-[0.18em] text-muted">
              {photos.length} FOTOS
            </span>
          </header>

          {photos.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted">
              Este álbum ainda não possui fotos.
            </p>
          ) : (
            <PhotoGrid photos={photos} albumName={album.name} />
          )}

          <section className="flex flex-col gap-4 border-t border-line pt-10">
            <span className="font-[family-name:var(--font-plex)] text-[10px] tracking-[0.2em] text-muted">
              OUTROS ÁLBUNS
            </span>
            <div className="flex flex-wrap gap-2.5">
              {others.map((other) => (
                <Link
                  key={other.id}
                  href={`/album/${other.id}`}
                  className="flex min-h-11 items-center rounded-full border border-[#26232f] px-5 text-xs tracking-[0.06em] transition-colors duration-300 hover:border-violet"
                >
                  {other.name}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
