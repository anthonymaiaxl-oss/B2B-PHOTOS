import AlbumGrid from "@/components/AlbumGrid";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import HighlightGallery from "@/components/HighlightGallery";
import ScrollStory from "@/components/ScrollStory";
import StatsSection from "@/components/StatsSection";
import { eventConfig } from "@/config/event";
import { getAllAlbums } from "@/lib/drive";
import type { Stat } from "@/types";

// 10 minutos. Precisa ser um literal: o Next lê este export por análise
// estática e não resolve identificador importado (REVALIDATE_SECONDS).
export const revalidate = 600;

export default async function HomePage() {
  const albums = await getAllAlbums();
  const totalPhotos = albums.reduce((total, album) => total + album.photos.length, 0);

  const highlights = albums.flatMap((album) => album.photos.slice(0, 2)).slice(0, 7);
  const heroPhoto = albums.find((album) => album.cover)?.cover ?? null;

  // Números reais do que está publicado — nada fixo no código.
  const stats: Stat[] = [
    { value: totalPhotos, prefix: totalPhotos > 0 ? "+" : "", label: "FOTOS" },
    { value: albums.length, label: "ÁLBUNS" },
    { value: eventConfig.partners.length, label: "REALIZADORES" },
  ];

  return (
    <>
      <Header />
      <main className="relative z-[2]">
        <Hero photo={heroPhoto} />
        <ScrollStory albums={albums} />
        <StatsSection stats={stats} />
        <AlbumGrid albums={albums} />
        <HighlightGallery photos={highlights} albums={albums} />
        <CTASection photo={highlights[0] ?? heroPhoto} albums={albums} />
      </main>
      <Footer />
    </>
  );
}
