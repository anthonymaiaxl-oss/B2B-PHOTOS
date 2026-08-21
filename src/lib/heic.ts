/**
 * HEIC / HEIF → JPEG, inteiramente no navegador.
 *
 * Por que no navegador e não no servidor:
 * o `sharp` que já roda em /api/photo usa o libvips pré-compilado, e essa
 * build NÃO traz o decodificador HEIF (é um add-on com licença separada).
 * Converter no servidor exigiria trocar o binário do sharp ou contratar um
 * serviço de imagem — as duas coisas que o projeto não quer. Fazendo aqui, o
 * custo é zero: nada de function, nada de cota, nada de mensalidade.
 *
 * Dois caminhos, nesta ordem:
 *
 *   1. `createImageBitmap` nativo. Safari (macOS/iOS) decodifica HEIC de
 *      fábrica, então o iPhone e o Mac convertem sem baixar um byte a mais.
 *
 *   2. `heic2any` (wasm, ~1,4 MB) via import dinâmico. Só é baixado quando o
 *      caminho 1 falha — Chrome e Firefox no Windows, tipicamente. Quem só
 *      envia JPG nunca carrega esse pacote.
 *
 * Se os dois falharem, o arquivo é marcado como ERRO em vez de ser enviado
 * como HEIC. Isso é intencional: um .heic dentro do álbum entra na listagem do
 * Drive (o MIME dele começa com "image/"), mas nem o `sharp` nem o navegador
 * conseguem exibi-lo — ele viraria uma foto quebrada na galeria pública.
 */

import { extensionOf } from "@/config/uploads";

/** Detecta HEIC/HEIF por extensão ou por MIME. */
export function isHeicLike(file: File): boolean {
  const ext = extensionOf(file.name);
  if (ext === "heic" || ext === "heif") return true;
  const mime = (file.type || "").toLowerCase();
  return mime.startsWith("image/heic") || mime.startsWith("image/heif");
}

/**
 * Confirmação pelos bytes do arquivo (ISO-BMFF: "....ftyp<brand>").
 * Usada só quando a extensão diz HEIC — serve para não gastar wasm com um
 * arquivo renomeado à mão que na verdade é um JPEG.
 */
export async function sniffHeic(file: File): Promise<boolean> {
  try {
    const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
    if (head.length < 12) return false;
    const tag = String.fromCharCode(head[4], head[5], head[6], head[7]);
    if (tag !== "ftyp") return false;
    const brand = String.fromCharCode(head[8], head[9], head[10], head[11]).toLowerCase();
    return ["heic", "heix", "hevc", "hevx", "heim", "heis", "hevm", "hevs", "mif1", "msf1"].includes(
      brand,
    );
  } catch {
    // Não conseguiu ler os bytes: deixa o fluxo normal decidir.
    return false;
  }
}

/** Carrega o heic2any uma única vez por sessão. */
let heic2anyPromise: Promise<(options: {
  blob: Blob;
  toType?: string;
  quality?: number;
}) => Promise<Blob | Blob[]>> | null = null;

function loadHeic2Any() {
  if (!heic2anyPromise) {
    heic2anyPromise = import("heic2any").then((mod) => {
      // O pacote é UMD: dependendo do bundler vem em `.default` ou direto.
      const candidate = (mod as unknown as { default?: unknown }).default ?? mod;
      return candidate as (options: {
        blob: Blob;
        toType?: string;
        quality?: number;
      }) => Promise<Blob | Blob[]>;
    });
  }
  return heic2anyPromise;
}

/** Caminho 1: decodificação nativa (Safari/iOS). Devolve null se indisponível. */
async function convertWithBitmap(file: File, quality: number): Promise<Blob | null> {
  if (typeof createImageBitmap !== "function") return null;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return null;
  }

  try {
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.drawImage(bitmap, 0, 0);
    return await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
  } finally {
    bitmap.close();
  }
}

/** Caminho 2: wasm. Só é chamado quando o nativo não deu conta. */
async function convertWithWasm(file: File, quality: number): Promise<Blob> {
  const heic2any = await loadHeic2Any();
  const result = await heic2any({ blob: file, toType: "image/jpeg", quality });
  // Um HEIC "sequence" (live photo) devolve vários quadros: fica o primeiro.
  const blob = Array.isArray(result) ? result[0] : result;
  if (!blob) throw new Error("A conversão não produziu imagem.");
  return blob;
}

/**
 * Converte um HEIC/HEIF em JPEG. Lança com mensagem em português se não der.
 * `quality` entre 0 e 1 — o painel passa o mesmo UPLOAD_QUALITY das outras fotos.
 */
export async function heicToJpeg(file: File, quality = 0.9): Promise<Blob> {
  const native = await convertWithBitmap(file, quality);
  if (native && native.size > 0) return native;

  try {
    return await convertWithWasm(file, quality);
  } catch (error) {
    console.error("[heic] conversão falhou", file.name, error);
    throw new Error(
      "Não foi possível converter este HEIC. Tente reenviar pelo iPhone com " +
        "“Mais compatível” ligado em Ajustes → Câmera → Formatos.",
    );
  }
}
