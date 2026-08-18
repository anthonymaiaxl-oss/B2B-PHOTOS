import AlbumGrid from "@/components/AlbumGrid";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import HighlightGallery from "@/components/HighlightGallery";
import ScrollStory from "@/components/ScrollStory";
import StatsSection from "@/components/StatsSection";
import { REVALIDATE_SECONDS } from "@/config/event";
import { getAllAlbums } from "@/lib/google-drive";

export const revalidate = REVALIDATE_SECONDS;

export default async function HomePage() {
  const albums = await getAllAlbums();
  const highlights = albums
    .flatMap((album) => album.photos.slice(0, 2))
    .slice(0, 7);
  const heroPhoto = albums.find((a) => a.cover)?.cover ?? null;

  return (
    <>
      <Header />
      <main>
        <Hero photo={heroPhoto} />
        <ScrollStory albums={albums} />
        <StatsSection />
        <AlbumGrid albums={albums} />
        <HighlightGallery photos={highlights} albums={albums} />
        <CTASection photo={highlights[0] ?? heroPhoto} />
      </main>
      <Footer />
    </>
  );
}
