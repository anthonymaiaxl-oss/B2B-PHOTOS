"use client";

import { eventConfig } from "@/config/event";
import ParallaxImage from "./ParallaxImage";
import Reveal from "./Reveal";
import type { AlbumWithPhotos } from "@/types";

export default function ScrollStory({ albums }: { albums: AlbumWithPhotos[] }) {
  const chapters = eventConfig.story;

  return (
    <section className="px-[22px]">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-[clamp(90px,18vh,190px)] py-[clamp(70px,14vh,150px)]">
        {chapters.map((chapter, index) => {
          const album = albums[index % albums.length];
          const photo = album?.photos[1] ?? album?.cover ?? null;

          return (
            <Reveal key={chapter.num} className="grid grid-cols-1 items-center gap-6">
              <div className="flex items-baseline gap-3.5">
                <span className="font-[family-name:var(--font-plex)] text-[10px] tracking-[0.18em] text-violet">
                  {chapter.num}
                </span>
                <h2 className="m-0 text-[clamp(38px,12vw,104px)] font-semibold leading-[0.9] tracking-[-0.035em]">
                  {chapter.word}
                </h2>
              </div>
              <p className="m-0 max-w-[440px] text-sm leading-relaxed text-muted text-pretty">
                {chapter.text}
              </p>
              <ParallaxImage
                photo={photo}
                alt={`${chapter.word} — ${eventConfig.name}`}
                depth={0.1 + index * 0.02}
                className="aspect-[16/10] w-full rounded-[3px]"
              />
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
