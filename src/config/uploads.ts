/**
 * Fonte única de verdade sobre o que pode ser enviado.
 *
 * Este arquivo é importado pelo NAVEGADOR (painel de envio) e pelo SERVIDOR
 * (rotas /api/admin/upload-session e /api/admin/upload). Manter a lista em um
 * lugar só evita o caso clássico de o painel aceitar um formato que a rota
 * recusa — e vice-versa.
 *
 * Regra de validação (a mesma nos dois lados):
 *   1. a extensão precisa estar na lista abaixo;
 *   2. quando o navegador informa um MIME type, ele precisa bater com a
 *      extensão. MIME vazio é tolerado de propósito: Windows/Chrome entregam
 *      `type: ""` para .HEIC e para vários .docx/.mov, e recusar por isso
 *      derrubaria arquivos legítimos.
 *
 * Ou seja: nunca confiamos só na extensão, mas também não deixamos o MIME
 * ausente bloquear o envio. Um arquivo perigoso (.exe, .js, .zip…) não passa
 * porque a extensão dele simplesmente não existe aqui.
 */

export type FileKind = "imagem" | "video" | "documento";

interface FormatSpec {
  /** Extensões em minúsculo, sem o ponto. */
  ext: string[];
  /** MIME types aceitos para essas extensões. */
  mimes: string[];
  kind: FileKind;
  /** Rótulo curto mostrado na fila do painel. */
  label: string;
}

const FORMATS: FormatSpec[] = [
  // ------------------------------------------------------------------ imagens
  { ext: ["jpg", "jpeg"], mimes: ["image/jpeg", "image/jpg", "image/pjpeg"], kind: "imagem", label: "JPG" },
  { ext: ["png"], mimes: ["image/png"], kind: "imagem", label: "PNG" },
  { ext: ["webp"], mimes: ["image/webp"], kind: "imagem", label: "WEBP" },
  {
    ext: ["heic"],
    // Safari manda "image/heic"; Chrome no Windows costuma mandar "" (vazio).
    mimes: ["image/heic", "image/heic-sequence", "image/heif", "image/heif-sequence"],
    kind: "imagem",
    label: "HEIC",
  },
  {
    ext: ["heif"],
    mimes: ["image/heif", "image/heif-sequence", "image/heic", "image/heic-sequence"],
    kind: "imagem",
    label: "HEIF",
  },

  // ------------------------------------------------------------------- vídeos
  { ext: ["mp4"], mimes: ["video/mp4", "application/mp4"], kind: "video", label: "MP4" },
  { ext: ["mov"], mimes: ["video/quicktime", "video/mov", "video/x-quicktime"], kind: "video", label: "MOV" },
  { ext: ["webm"], mimes: ["video/webm"], kind: "video", label: "WEBM" },

  // -------------------------------------------------------------- documentos
  { ext: ["pdf"], mimes: ["application/pdf"], kind: "documento", label: "PDF" },
  { ext: ["doc"], mimes: ["application/msword"], kind: "documento", label: "DOC" },
  {
    ext: ["docx"],
    mimes: [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ],
    kind: "documento",
    label: "DOCX",
  },
  { ext: ["xls"], mimes: ["application/vnd.ms-excel"], kind: "documento", label: "XLS" },
  {
    ext: ["xlsx"],
    mimes: [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ],
    kind: "documento",
    label: "XLSX",
  },
  { ext: ["ppt"], mimes: ["application/vnd.ms-powerpoint"], kind: "documento", label: "PPT" },
  {
    ext: ["pptx"],
    mimes: [
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.ms-powerpoint",
    ],
    kind: "documento",
    label: "PPTX",
  },
];

/** Índice extensão → especificação. Montado uma vez. */
const BY_EXT = new Map<string, FormatSpec>();
for (const spec of FORMATS) {
  for (const ext of spec.ext) BY_EXT.set(ext, spec);
}

/**
 * Limites de tamanho.
 *
 * MAX_UPLOAD_BYTES continua sendo o mesmo valor que a rota já usava (200 MB);
 * só saiu de dentro do route.ts para poder ser lido também pelo painel, que
 * agora avisa antes de enfileirar em vez de deixar o envio falhar no fim.
 * MAX_FALLBACK_BYTES é o teto do caminho reserva (limite prático de 4,5 MB das
 * functions da Vercel), idêntico ao que já existia.
 */
export const MAX_UPLOAD_BYTES = 200 * 1024 * 1024;
export const MAX_FALLBACK_BYTES = 4 * 1024 * 1024;

/** "IMG_1024.HEIC" → "heic". Sem extensão devolve "". */
export function extensionOf(name: string): string {
  const match = /\.([a-z0-9]+)$/i.exec(name.trim());
  return match ? match[1].toLowerCase() : "";
}

/** Troca a extensão preservando o resto do nome. */
export function replaceExtension(name: string, nextExt: string): string {
  const base = name.replace(/\.[^.]+$/, "");
  return `${base}.${nextExt}`;
}

export function specFor(name: string): FormatSpec | null {
  return BY_EXT.get(extensionOf(name)) ?? null;
}

export function kindOf(name: string): FileKind | null {
  return specFor(name)?.kind ?? null;
}

/** Rótulo curto ("JPG", "MOV", "XLSX") para mostrar na fila. */
export function labelOf(name: string): string {
  return specFor(name)?.label ?? extensionOf(name).toUpperCase();
}

/**
 * MIME "oficial" da extensão. Usado quando o navegador não informa nenhum —
 * o Google Drive precisa de um Content-Type para abrir a sessão de upload.
 */
export function primaryMimeFor(name: string): string {
  return specFor(name)?.mimes[0] ?? "application/octet-stream";
}

export interface Validation {
  ok: boolean;
  /** Mensagem pronta para o usuário quando `ok` é false. */
  reason?: string;
  kind?: FileKind;
}

/**
 * Valida nome + MIME + tamanho. Usada nos dois lados (painel e rotas de API).
 * `size` é opcional para permitir validar antes de conhecer o tamanho final.
 */
export function validateUpload(
  name: string,
  mimeType: string | undefined,
  size?: number,
  maxBytes: number = MAX_UPLOAD_BYTES,
): Validation {
  const ext = extensionOf(name);
  if (!ext) {
    return { ok: false, reason: "Arquivo sem extensão." };
  }

  const spec = BY_EXT.get(ext);
  if (!spec) {
    return { ok: false, reason: `Formato .${ext.toUpperCase()} não é aceito.` };
  }

  // MIME vazio é aceito (ver comentário no topo). MIME presente precisa bater.
  const mime = (mimeType ?? "").trim().toLowerCase();
  if (mime && !spec.mimes.includes(mime)) {
    return {
      ok: false,
      reason: `O conteúdo do arquivo (${mime}) não corresponde à extensão .${ext.toUpperCase()}.`,
    };
  }

  if (size !== undefined) {
    if (size <= 0) return { ok: false, reason: "Arquivo vazio." };
    if (size > maxBytes) {
      return {
        ok: false,
        reason: `Arquivo acima de ${Math.round(maxBytes / (1024 * 1024))} MB.`,
      };
    }
  }

  return { ok: true, kind: spec.kind };
}

/** Valor do atributo `accept` do <input type="file">. */
export const ACCEPT_ATTRIBUTE = [
  ...FORMATS.flatMap((spec) => spec.ext.map((ext) => `.${ext}`)),
  "image/*",
  "video/*",
  "application/pdf",
].join(",");

/** Listas legíveis para a interface. */
export const FORMAT_SUMMARY: Record<FileKind, string> = {
  imagem: "JPG · JPEG · PNG · WEBP · HEIC · HEIF",
  video: "MP4 · MOV · WEBM",
  documento: "PDF · DOC · DOCX · XLS · XLSX · PPT · PPTX",
};

/** Nome da subpasta onde o .HEIC original é preservado dentro do álbum. */
export const ORIGINALS_FOLDER = "_originais";
