import Link from "next/link";
import ParallaxImage from "./ParallaxImage";
import Reveal from "./Reveal";
import type { AlbumWithPhotos, Photo } from "@/types";

export default function CTASection({
  photo,
  albums,
}: {
  photo: Photo | null;
  albums: AlbumWithPhotos[];
}) {
  const first = albums[0];

  return (
    <section className="relative flex min-h-[78svh] items-center overflow-hidden px-[22px]">
      <ParallaxImage photo={photo} alt="" depth={0.14} className="absolute inset-0" />
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(180deg,#04060e,rgba(8,18,39,0.6)_45%,#04060e)]"
      />
      <span
        aria-hidden="true"
        className="animate-glow absolute bottom-[-20%] left-1/2 -ml-[420px] h-[min(120vw,840px)] w-[min(120vw,840px)] rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.24),transparent_65%)] blur-[40px]"
      />

      <Reveal className="relative mx-auto flex w-full max-w-[1180px] flex-col gap-5">
        <h2 className="m-0 max-w-[900px] text-[clamp(34px,10vw,100px)] font-extrabold leading-[0.9] tracking-[-0.04em] text-white">
          ENCONTRE A SUA <span className="text-gold-gradient">FOTO</span>.
        </h2>
        <p className="m-0 max-w-[430px] text-[15px] leading-relaxed text-muted">
          Baixe em alta resolução, uma por uma ou várias de uma vez. Sem cadastro,
          sem marca d&apos;água.
        </p>
        {first && (
          <Link
            href={`/album/${first.id}`}
            data-cursor="→"
            className="gold-sheen flex min-h-[54px] w-fit items-center rounded-full bg-gradient-to-b from-gold-bright to-gold px-9 text-[11px] font-bold tracking-[0.2em] text-ink transition-all duration-300 hover:-translate-y-0.5 hover:from-white hover:to-gold-bright"
          >
            ABRIR A GALERIA
          </Link>
        )}
      </Reveal>
    </section>
  );
}
