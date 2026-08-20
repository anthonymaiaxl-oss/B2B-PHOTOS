import type { Photo } from "@/types";

/** Nome de arquivo previsível: "master-class-palestras-014.jpg". */
export function fileNameFor(photo: Photo, albumName: string, index?: number): string {
  const base = `${albumName}-${photo.name}`
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9-_ ]+/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
  const suffix = index === undefined ? "" : `-${String(index + 1).padStart(3, "0")}`;
  return `${base || "foto"}${suffix}.jpg`;
}

/** Download de uma foto. A rota /api/download já manda o Content-Disposition. */
export function downloadOne(photo: Photo, albumName: string): void {
  const anchor = document.createElement("a");
  anchor.href = photo.downloadUrl;
  anchor.download = fileNameFor(photo, albumName);
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export interface ZipProgress {
  done: number;
  total: number;
  failed: number;
  phase: "baixando" | "compactando" | "pronto";
}

/**
 * Monta o .zip no próprio navegador.
 *
 * Os bytes vêm de /api/download (mesmo domínio, sem problema de CORS) e o
 * arquivo nunca é montado no servidor — uma function serverless estouraria
 * o tempo limite com dezenas de fotos.
 */
export async function downloadZip(
  photos: Photo[],
  albumName: string,
  onProgress: (progress: ZipProgress) => void,
): Promise<void> {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  const folder = zip.folder(albumName) ?? zip;

  let done = 0;
  let failed = 0;

  // Sequencial de propósito: em rede de celular, 60 downloads em paralelo
  // derrubam a conexão e o navegador cancela metade.
  for (const [index, photo] of photos.entries()) {
    try {
      const response = await fetch(photo.downloadUrl);
      if (!response.ok) throw new Error(String(response.status));
      folder.file(fileNameFor(photo, albumName, index), await response.blob());
    } catch (error) {
      console.error("[zip] falhou", photo.id, error);
      failed += 1;
    }
    done += 1;
    onProgress({ done, total: photos.length, failed, phase: "baixando" });
  }

  onProgress({ done, total: photos.length, failed, phase: "compactando" });

  const blob = await zip.generateAsync({ type: "blob", compression: "STORE" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${albumName.toLowerCase().replace(/\s+/g, "-")}-fotos.zip`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Só revoga depois que o navegador iniciou o salvamento.
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);

  onProgress({ done, total: photos.length, failed, phase: "pronto" });
}
