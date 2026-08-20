import { UPLOAD_MAX_EDGE, UPLOAD_QUALITY } from "@/config/event";

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
 */
export async function optimizeImage(file: File): Promise<Optimized> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
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
  if (blob.size >= file.size) {
    return { blob: file, name: file.name, mimeType: file.type, originalSize: file.size };
  }

  return {
    blob,
    name: file.name.replace(/\.[^.]+$/, "") + ".jpg",
    mimeType: "image/jpeg",
    originalSize: file.size,
  };
}
