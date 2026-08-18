import Link from "next/link";
import { eventConfig } from "@/config/event";
import ParallaxImage from "./ParallaxImage";
import Reveal from "./Reveal";
import type { Photo } from "@/types";

export default function CTASection({ photo }: { photo: Photo | null }) {
  const firstAlbum = eventConfig.albums[0];

  return (
    <section className="relative flex min-h-[78svh] items-center overflow-hidden px-[22px]">
      <ParallaxImage
        photo={photo}
        alt=""
        depth={0.14}
        className="absolute inset-0"
        sizes="100vw"
      />
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(180deg,#050509,rgba(5,5,9,0.45)_45%,#050509)]"
      />
      <span
        aria-hidden="true"
        className="absolute bottom-[-20%] left-1/2 h-[min(120vw,900px)] w-[min(120vw,900px)] -ml-[450px] rounded-full bg-[radial-gradient(circle,rgba(168,85,247,0.3),transparent_65%)] blur-[40px]"
      />
      <Reveal className="relative mx-auto flex w-full max-w-[1180px] flex-col gap-5">
        <h2 className="m-0 max-w-[900px] text-[clamp(38px,11vw,110px)] font-semibold leading-[0.9] tracking-[-0.04em]">
          ENCONTRE O SEU MOMENTO.
        </h2>
        <p className="m-0 max-w-[400px] text-[15px] leading-relaxed text-muted">
          Talvez você esteja em uma dessas fotos.
        </p>
        <Link
          href={`/album/${firstAlbum.id}`}
          data-cursor="→"
          className="flex min-h-[54px] w-fit items-center rounded-full bg-violet px-8 text-xs font-semibold tracking-[0.2em] text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-violet-bright hover:text-white"
        >
          EXPLORAR GALERIA
        </Link>
      </Reveal>
    </section>
  );
}
