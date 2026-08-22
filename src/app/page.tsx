import AlbumGrid from "@/components/AlbumGrid";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import OrganizerBridge from "@/components/OrganizerBridge";
import HighlightGallery from "@/components/HighlightGallery";
import ScrollStory from "@/components/ScrollStory";
import StatsSection from "@/components/StatsSection";
import { eventConfig } from "@/config/event";
import { getAllAlbums } from "@/lib/drive";
import { buildPhotoIndex, resolveSectionPhoto } from "@/lib/section-photo";
import type { Stat } from "@/types";

// 10 minutos. Precisa ser um literal: o Next lê este export por análise
// estática e não resolve identificador importado (REVALIDATE_SECONDS).
export const revalidate = 600;

export default async function HomePage() {
  const albums = await getAllAlbums();
  const totalPhotos = albums.reduce((total, album) => total + album.photos.length, 0);

  const highlights = albums.flatMap((album) => album.photos.slice(0, 2)).slice(0, 7);

  // Fotos escolhidas à mão em `sectionImages` (src/config/event.ts). Campo
  // vazio ou caminho de public/ mantém o comportamento automático de antes.
  const photoIndex = buildPhotoIndex(albums);
  const { sectionImages } = eventConfig;

  const heroPhoto = resolveSectionPhoto(
    sectionImages.hero,
    photoIndex,
    albums.find((album) => album.cover)?.cover ?? null,
  );

  const storyPhotos = sectionImages.story.map((value, index) => {
    const album = albums.length ? albums[index % albums.length] : null;
    return resolveSectionPhoto(
      value,
      photoIndex,
      album?.photos[1] ?? album?.cover ?? null,
    );
  });

  const ctaPhoto = resolveSectionPhoto(
    sectionImages.cta,
    photoIndex,
    highlights[0] ?? heroPhoto,
  );

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
        <Hero />
        <OrganizerBridge />
        <ScrollStory albums={albums} photos={storyPhotos} />
        <StatsSection stats={stats} />
        <AlbumGrid albums={albums} />
        <HighlightGallery photos={highlights} albums={albums} />
        <CTASection photo={ctaPhoto} albums={albums} />
      </main>
      <Footer />
    </>
  );
}
