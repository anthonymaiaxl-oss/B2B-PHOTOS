import type { AlbumWithPhotos, Photo } from "@/types";

/**
 * Resolve os campos de `sectionImages` (src/config/event.ts).
 *
 * Cada campo aceita três formas:
 *
 *   "/secoes/hero.jpg"  → arquivo fixo em public/. Tratado fora daqui.
 *   "IMG_1024.jpg"      → uma foto REAL, escolhida pelo nome, de qualquer álbum.
 *   ""                  → automático: o site escolhe uma foto do álbum.
 *
 * A segunda forma é a que resolve o caso "as fotos boas estão no álbum e eu
 * quero aquela no topo": dá para apontar a foto exata sem tirá-la da galeria e
 * sem duplicar arquivo no repositório. O nome é o mesmo que aparece na área da
 * organização, com ou sem extensão, e a comparação ignora maiúsculas.
 */

/** Caminho de arquivo em public/ (começa com "/"). */
export function isFixedPath(value: string): boolean {
  return value.startsWith("/");
}

function normalize(name: string): string {
  return name
    .replace(/\.[^.]+$/, "")
    .trim()
    .toLowerCase();
}

/** Índice nome → foto, montado uma vez por render da home. */
export function buildPhotoIndex(albums: AlbumWithPhotos[]): Map<string, Photo> {
  const index = new Map<string, Photo>();
  for (const album of albums) {
    for (const photo of album.photos) {
      const key = normalize(photo.name);
      // O primeiro vence: se houver nomes repetidos em álbuns diferentes,
      // manda a ordem natural dos álbuns em vez de um resultado imprevisível.
      if (key && !index.has(key)) index.set(key, photo);
    }
  }
  return index;
}

/**
 * Devolve a foto escolhida no config, ou `fallback` quando o campo está vazio,
 * aponta para um arquivo em public/, ou nomeia uma foto que não existe mais
 * (apagada do álbum, por exemplo) — nesse caso a seção continua funcionando.
 */
export function resolveSectionPhoto(
  value: string,
  index: Map<string, Photo>,
  fallback: Photo | null,
): Photo | null {
  if (!value || isFixedPath(value)) return fallback;
  return index.get(normalize(value)) ?? fallback;
}
