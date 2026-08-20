import { eventConfig } from "@/config/event";
import type { Photo } from "@/types";

/**
 * Modo demonstração. Ativo enquanto o Google Drive não está conectado
 * (falta GOOGLE_CLIENT_ID/SECRET/REFRESH_TOKEN ou GOOGLE_DRIVE_ROOT_FOLDER_ID).
 * Assim dá para ver o site inteiro antes de configurar qualquer coisa.
 */
const UNSPLASH = [
  "photo-1540575467063-178a50c2df87",
  "photo-1517048676732-d65bc937f952",
  "photo-1552664730-d307ca884978",
  "photo-1531482615713-2afd69097998",
  "photo-1505373877841-8d25f7d46678",
  "photo-1521737604893-d14cc237f11d",
  "photo-1511578314322-379afb476865",
  "photo-1543269865-cbf427effbad",
  "photo-1556761175-b413da4baf72",
  "photo-1519389950473-47ba0277781c",
  "photo-1568992687947-868a62a9f521",
  "photo-1526948128573-703ee1aeb6fa",
];

const src = (slug: string, w: number) =>
  `https://images.unsplash.com/${slug}?auto=format&fit=crop&w=${w}&q=80`;

export function mockPhotos(albumId: string): Photo[] {
  const index = Math.max(0, eventConfig.demoAlbums.findIndex((a) => a.id === albumId));
  const count = 12 + index;

  return Array.from({ length: count }, (_, i) => {
    const slug = UNSPLASH[(index * 5 + i) % UNSPLASH.length];
    return {
      id: `${albumId}-${i + 1}`,
      name: `${albumId}-${String(i + 1).padStart(3, "0")}`,
      thumbnailUrl: src(slug, 900),
      previewUrl: src(slug, 2000),
      downloadUrl: src(slug, 2400),
      width: 1600,
      height: i % 3 === 0 ? 2000 : 1067,
      size: 1_400_000,
    };
  });
}
