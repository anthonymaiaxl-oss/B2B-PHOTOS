import type { Photo } from "@/types";

/**
 * Larguras que a rota /api/photo aceita. Precisa bater com a lista de WIDTHS
 * em src/app/api/photo/[id]/route.ts — a rota arredonda para a próxima largura
 * permitida, então pedir um valor fora da lista só desperdiça uma variação de
 * cache no CDN.
 */
export const PHOTO_WIDTHS = [600, 900, 1400, 2000, 2600] as const;

/** Largura usada quando o navegador ignora o srcSet. */
export const PHOTO_FALLBACK_WIDTH = 1400;

/**
 * srcSet de uma foto do Drive.
 *
 * Por que isso existe: as seções editoriais e o bloco final usavam
 * `photo.thumbnailUrl`, que é fixo em 900px. Só que essas imagens ocupam a
 * largura inteira do bloco — e no caso do CTA, a tela toda — e ainda são
 * ampliadas em 12% pelo efeito de parallax. Uma imagem de 900px esticada para
 * 1400, 2000 ou mais aparece borrada, e numa tela retina o dobro disso.
 *
 * Com srcSet o navegador escolhe a largura certa considerando o tamanho real
 * do elemento e a densidade da tela, sem baixar mais do que precisa no celular.
 */
export function photoSrcSet(photo: Photo): string {
  return PHOTO_WIDTHS.map((width) => `/api/photo/${photo.id}?w=${width} ${width}w`).join(", ");
}

export function photoSrc(photo: Photo, width: number = PHOTO_FALLBACK_WIDTH): string {
  return `/api/photo/${photo.id}?w=${width}`;
}
