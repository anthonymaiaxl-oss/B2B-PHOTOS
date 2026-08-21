import { UPLOAD_MAX_EDGE, UPLOAD_QUALITY } from "@/config/event";
import { replaceExtension } from "@/config/uploads";

export interface Optimized {
  blob: Blob;
  name: string;
  mimeType: string;
  originalSize: number;
}

/**
 * Reduz a foto no próprio navegador antes de enviar.
 *
 * Motivo: o Drive institucional tem cota. Uma foto de 6 MB da câmera vira
 * ~700 KB em 2560px sem diferença visível na tela — e o álbum carrega mais
 * rápido para quem vai ver. `imageOrientation: "from-image"` respeita o EXIF,
 * senão fotos em pé chegariam deitadas.
 *
 * Aceita `Blob` além de `File` para poder receber o JPEG que sai da conversão
 * de HEIC (que não é um File e não tem `.name`). O comportamento para `File`
 * continua exatamente o mesmo de antes.
 */
export async function optimizeImage(source: File | Blob, name?: string): Promise<Optimized> {
  const sourceName = name ?? (source instanceof File ? source.name : "foto.jpg");
  const sourceType = source.type || "image/jpeg";

  const bitmap = await createImageBitmap(source, { imageOrientation: "from-image" });
  const scale = Math.min(1, UPLOAD_MAX_EDGE / Math.max(bitmap.width, bitmap.height));

  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("O navegador não permitiu processar a imagem.");
  }

  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", UPLOAD_QUALITY),
  );
  if (!blob) throw new Error("Falha ao converter a imagem.");

  // Se a compressão não ajudou (foto já pequena), manda o arquivo original.
  if (blob.size >= source.size) {
    return { blob: source, name: sourceName, mimeType: sourceType, originalSize: source.size };
  }

  return {
    blob,
    name: replaceExtension(sourceName, "jpg"),
    mimeType: "image/jpeg",
    originalSize: source.size,
  };
}
