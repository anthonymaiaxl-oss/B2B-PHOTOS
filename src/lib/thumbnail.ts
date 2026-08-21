/**
 * Miniaturas da fila de envio.
 *
 * Regra de ouro deste arquivo: NUNCA manter o arquivo inteiro decodificado na
 * memória. Selecionar 300 fotos de 8 MB e criar um object URL apontando para
 * cada original faria o navegador decodificar ~2,4 GB de bitmap ao rolar a
 * lista. Aqui cada item vira um JPEG de 240px (~8 KB) e o object URL do
 * original é liberado no mesmo instante.
 *
 * Todo object URL criado aqui precisa ser devolvido para `releaseThumbnail`.
 */

const THUMB_EDGE = 240;
const THUMB_QUALITY = 0.6;
/** Tempo máximo esperando o primeiro quadro de um vídeo. */
const VIDEO_TIMEOUT_MS = 6000;

function canvasToObjectUrl(canvas: HTMLCanvasElement): Promise<string | null> {
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob ? URL.createObjectURL(blob) : null),
      "image/jpeg",
      THUMB_QUALITY,
    );
  });
}

/** Miniatura de uma imagem já decodificável pelo navegador. */
async function imageThumbnail(source: Blob): Promise<string | null> {
  if (typeof createImageBitmap !== "function") return null;

  try {
    // `imageOrientation: "from-image"` respeita o EXIF — sem isso a miniatura
    // de uma foto em pé apareceria deitada na fila.
    const probe = await createImageBitmap(source, { imageOrientation: "from-image" });
    const scale = Math.min(1, THUMB_EDGE / Math.max(probe.width, probe.height));
    const width = Math.max(1, Math.round(probe.width * scale));
    const height = Math.max(1, Math.round(probe.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      probe.close();
      return null;
    }
    context.drawImage(probe, 0, 0, width, height);
    probe.close();
    return await canvasToObjectUrl(canvas);
  } catch {
    return null;
  }
}

/** Primeiro quadro de um vídeo. Só carrega os primeiros bytes do arquivo. */
async function videoThumbnail(file: Blob): Promise<string | null> {
  const sourceUrl = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "metadata";
  video.src = sourceUrl;

  try {
    const frame = await new Promise<string | null>((resolve) => {
      const timer = window.setTimeout(() => finish(null), VIDEO_TIMEOUT_MS);

      const finish = (value: string | null) => {
        window.clearTimeout(timer);
        video.onloadeddata = null;
        video.onseeked = null;
        video.onerror = null;
        resolve(value);
      };

      const draw = () => {
        try {
          const scale = Math.min(1, THUMB_EDGE / Math.max(video.videoWidth, video.videoHeight));
          const width = Math.max(1, Math.round(video.videoWidth * scale));
          const height = Math.max(1, Math.round(video.videoHeight * scale));
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const context = canvas.getContext("2d");
          if (!context) return finish(null);
          context.drawImage(video, 0, 0, width, height);
          void canvasToObjectUrl(canvas).then(finish);
        } catch {
          finish(null);
        }
      };

      video.onerror = () => finish(null);
      video.onloadeddata = () => {
        // Pula o primeiro instante: muito vídeo começa com um quadro preto.
        if (video.duration && video.duration > 0.3) {
          video.onseeked = draw;
          video.currentTime = Math.min(0.3, video.duration / 2);
        } else {
          draw();
        }
      };
    });

    return frame;
  } catch {
    return null;
  } finally {
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(sourceUrl);
  }
}

/**
 * Miniatura de um arquivo da fila. Devolve um object URL ou null quando o
 * formato não tem pré-visualização possível (PDF, DOCX, HEIC ainda não
 * convertido em navegador sem suporte…).
 */
export async function makeThumbnail(
  source: Blob,
  kind: "imagem" | "video" | "documento",
): Promise<string | null> {
  if (kind === "imagem") return imageThumbnail(source);
  if (kind === "video") return videoThumbnail(source);
  return null;
}

/** Libera a miniatura. Chamar sempre que o item sair da fila. */
export function releaseThumbnail(url: string | null | undefined): void {
  if (url) URL.revokeObjectURL(url);
}
