import { UPLOAD_QUALITY } from "@/config/event";
import { kindOf, primaryMimeFor, replaceExtension, type FileKind } from "@/config/uploads";
import { heicToJpeg, isHeicLike, sniffHeic } from "@/lib/heic";
import { optimizeImage } from "@/lib/optimize-image";

export interface Prepared {
  /** Bytes que vão para o Drive. */
  blob: Blob;
  name: string;
  mimeType: string;
  kind: FileKind;
  /** true quando o arquivo passou por HEIC/HEIF → JPEG. */
  convertedFromHeic: boolean;
  /**
   * Arquivo original a preservar no Drive (subpasta `_originais` do álbum).
   * Só é preenchido para HEIC/HEIF de verdade, e só se a opção estiver ligada.
   */
  preserveOriginal: File | null;
}

/**
 * Deixa um arquivo pronto para o envio, decidindo o mínimo necessário:
 *
 *   HEIC/HEIF      → converte para JPEG (a galeria não exibe HEIC)
 *   JPG/PNG/WEBP   → só redimensiona se a otimização estiver ligada
 *   vídeo/documento → passa intacto, sem tocar nos bytes
 *
 * Nada de recomprimir JPEG por recomprimir — é o que o briefing pede e é
 * também o que preserva qualidade.
 */
export async function prepareUpload(
  file: File,
  options: { optimize: boolean; keepHeicOriginal: boolean },
): Promise<Prepared> {
  const kind = kindOf(file.name) ?? "documento";

  // --------------------------------------------------- vídeos e documentos
  // Passam direto. Recomprimir ou reempacotar aqui só destruiria qualidade e
  // gastaria memória do navegador à toa.
  if (kind !== "imagem") {
    return {
      blob: file,
      name: file.name,
      mimeType: file.type || primaryMimeFor(file.name),
      kind,
      convertedFromHeic: false,
      preserveOriginal: null,
    };
  }

  // -------------------------------------------------------------- HEIC/HEIF
  if (isHeicLike(file)) {
    // `heicToJpeg` tenta primeiro o decodificador nativo — que também dá conta
    // de um arquivo com extensão .heic que na verdade é JPEG — e só cai no
    // wasm quando é HEIC de verdade em navegador sem suporte.
    const jpeg = await heicToJpeg(file, UPLOAD_QUALITY);
    const jpegName = replaceExtension(file.name, "jpg");

    // Só preserva o original se os bytes forem mesmo de um contêiner HEIC.
    const isRealHeic = options.keepHeicOriginal ? await sniffHeic(file) : false;
    const preserveOriginal = isRealHeic ? file : null;

    if (options.optimize) {
      try {
        // Otimiza o JPEG já convertido — nunca o HEIC. Isso é importante:
        // `optimizeImage` devolve a fonte intacta quando a compressão não
        // compensa, e devolver o HEIC aqui recolocaria o formato quebrado.
        const optimized = await optimizeImage(jpeg, jpegName);
        return {
          blob: optimized.blob,
          name: optimized.name,
          mimeType: optimized.mimeType,
          kind: "imagem",
          convertedFromHeic: true,
          preserveOriginal,
        };
      } catch (error) {
        console.warn("[upload] otimização do HEIC convertido indisponível", file.name, error);
      }
    }

    return {
      blob: jpeg,
      name: jpegName,
      mimeType: "image/jpeg",
      kind: "imagem",
      convertedFromHeic: true,
      preserveOriginal,
    };
  }

  // ----------------------------------------------- JPG / JPEG / PNG / WEBP
  if (options.optimize) {
    try {
      const optimized = await optimizeImage(file);
      return {
        blob: optimized.blob,
        name: optimized.name,
        mimeType: optimized.mimeType,
        kind: "imagem",
        convertedFromHeic: false,
        preserveOriginal: null,
      };
    } catch (error) {
      // Formato que o navegador não decodifica: envia como veio em vez de
      // perder a foto. Era o comportamento anterior e continua valendo.
      console.warn("[upload] otimização indisponível", file.name, error);
    }
  }

  return {
    blob: file,
    name: file.name,
    mimeType: file.type || primaryMimeFor(file.name),
    kind: "imagem",
    convertedFromHeic: false,
    preserveOriginal: null,
  };
}
