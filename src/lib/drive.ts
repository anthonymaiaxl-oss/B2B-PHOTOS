import { REVALIDATE_SECONDS, eventConfig } from "@/config/event";
import { getAccessToken, getRootFolderId, isDriveConfigured } from "@/lib/google-auth";
import { displayName, slugify } from "@/lib/slug";
import { mockPhotos } from "@/lib/mock-data";
import type { Album, AlbumWithPhotos, DriveFile, Photo, StorageQuota } from "@/types";

const API = "https://www.googleapis.com/drive/v3";
const UPLOAD_API = "https://www.googleapis.com/upload/drive/v3";
const FOLDER_MIME = "application/vnd.google-apps.folder";

/** Presente em toda chamada: faz o código funcionar também em Drive compartilhado. */
const SHARED_DRIVE_PARAMS = {
  supportsAllDrives: "true",
  includeItemsFromAllDrives: "true",
} as const;

async function driveFetch(
  url: string,
  init: RequestInit = {},
  revalidate?: number,
): Promise<Response> {
  const token = await getAccessToken();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);

  return fetch(url, {
    ...init,
    headers,
    ...(revalidate === undefined
      ? { cache: "no-store" as RequestCache }
      : { next: { revalidate } }),
  });
}

async function driveJson<T>(url: string, init?: RequestInit, revalidate?: number): Promise<T> {
  const res = await driveFetch(url, init, revalidate);
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Drive ${res.status}: ${detail.slice(0, 400)}`);
  }
  return (await res.json()) as T;
}

/* ------------------------------------------------------------------ leitura */

function toPhoto(file: DriveFile): Photo {
  return {
    id: file.id,
    name: file.name.replace(/\.[^.]+$/, ""),
    thumbnailUrl: `/api/photo/${file.id}?w=900`,
    previewUrl: `/api/photo/${file.id}?w=2000`,
    downloadUrl: `/api/download/${file.id}`,
    width: file.imageMediaMetadata?.width,
    height: file.imageMediaMetadata?.height,
    size: file.size ? Number(file.size) : undefined,
    createdTime: file.createdTime,
  };
}

/** Lista todos os arquivos de imagem de uma pasta (segue a paginação do Drive). */
export async function listFolderImages(
  folderId: string,
  revalidate = REVALIDATE_SECONDS,
): Promise<DriveFile[]> {
  if (!folderId) return [];

  const files: DriveFile[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      q: [
        `"${folderId}" in parents`,
        "mimeType contains 'image/'",
        "trashed = false",
      ].join(" and "),
      fields:
        "nextPageToken, files(id,name,mimeType,size,createdTime,imageMediaMetadata(width,height))",
      orderBy: "name_natural",
      pageSize: "200",
      ...SHARED_DRIVE_PARAMS,
    });
    if (pageToken) params.set("pageToken", pageToken);

    const data = await driveJson<{ files?: DriveFile[]; nextPageToken?: string }>(
      `${API}/files?${params}`,
      undefined,
      revalidate,
    );
    files.push(...(data.files ?? []));
    pageToken = data.nextPageToken;
    // Trava de segurança: 2000 fotos por álbum já é muito além do cenário real.
  } while (pageToken && files.length < 2000);

  return files;
}

/** Cada subpasta da pasta raiz é um álbum. */
export async function listAlbums(): Promise<Album[]> {
  if (!isDriveConfigured()) return eventConfig.demoAlbums;

  try {
    const params = new URLSearchParams({
      q: [
        `"${getRootFolderId()}" in parents`,
        `mimeType = "${FOLDER_MIME}"`,
        "trashed = false",
      ].join(" and "),
      fields: "files(id,name)",
      orderBy: "name_natural",
      pageSize: "100",
      ...SHARED_DRIVE_PARAMS,
    });

    const data = await driveJson<{ files?: { id: string; name: string }[] }>(
      `${API}/files?${params}`,
      undefined,
      REVALIDATE_SECONDS,
    );

    const seen = new Set<string>();
    return (data.files ?? []).map((folder) => {
      let id = slugify(folder.name) || folder.id.slice(0, 8).toLowerCase();
      while (seen.has(id)) id = `${id}-2`;
      seen.add(id);
      return {
        id,
        name: displayName(folder.name),
        caption: eventConfig.albumCaptions[id] ?? "",
        folderId: folder.id,
      };
    });
  } catch (error) {
    console.error("[drive] falha ao listar os álbuns", error);
    return [];
  }
}

/** Fotos de um álbum. */
export async function getAlbumPhotos(album: Album): Promise<Photo[]> {
  if (!isDriveConfigured()) return mockPhotos(album.id);

  try {
    const files = await listFolderImages(album.folderId);
    return files.map(toPhoto);
  } catch (error) {
    console.error("[drive] falha ao carregar o álbum", album.id, error);
    return [];
  }
}

/** Todos os álbuns já com as fotos resolvidas (home). */
export async function getAllAlbums(): Promise<AlbumWithPhotos[]> {
  const albums = await listAlbums();
  return Promise.all(
    albums.map(async (album) => {
      const photos = await getAlbumPhotos(album);
      return { ...album, photos, cover: photos[0] ?? null };
    }),
  );
}

export async function findAlbum(slug: string): Promise<Album | null> {
  const albums = await listAlbums();
  return albums.find((album) => album.id === slug) ?? null;
}

/* ----------------------------------------------------------------- binários */

/** Bytes originais de um arquivo. Usado pelo proxy de imagem e pelo download. */
export async function getFileStream(fileId: string): Promise<Response> {
  const params = new URLSearchParams({ alt: "media", ...SHARED_DRIVE_PARAMS });
  return driveFetch(`${API}/files/${fileId}?${params}`);
}

export async function getFileMeta(fileId: string): Promise<DriveFile> {
  const params = new URLSearchParams({
    fields: "id,name,mimeType,size,createdTime,imageMediaMetadata(width,height)",
    ...SHARED_DRIVE_PARAMS,
  });
  return driveJson<DriveFile>(`${API}/files/${fileId}?${params}`, undefined, 3600);
}

/* ------------------------------------------------------------------ escrita */

export async function createFolder(
  name: string,
  parentId: string,
): Promise<{ id: string; name: string }> {
  const params = new URLSearchParams({ fields: "id,name", ...SHARED_DRIVE_PARAMS });
  return driveJson<{ id: string; name: string }>(`${API}/files?${params}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, mimeType: FOLDER_MIME, parents: [parentId] }),
  });
}

/**
 * Abre uma sessão de upload resumível e devolve a URL da sessão.
 * O navegador envia os bytes direto para essa URL: o access token nunca sai do
 * servidor e o arquivo não passa pela function (sem o limite de 4,5 MB da Vercel).
 */
export async function createResumableSession(input: {
  name: string;
  mimeType: string;
  size: number;
  folderId: string;
}): Promise<string> {
  const params = new URLSearchParams({
    uploadType: "resumable",
    fields: "id,name",
    ...SHARED_DRIVE_PARAMS,
  });

  const res = await driveFetch(`${UPLOAD_API}/files?${params}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      "X-Upload-Content-Type": input.mimeType,
      "X-Upload-Content-Length": String(input.size),
    },
    body: JSON.stringify({ name: input.name, parents: [input.folderId] }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Drive ${res.status} ao abrir a sessão: ${detail.slice(0, 300)}`);
  }

  const location = res.headers.get("location");
  if (!location) throw new Error("O Google não devolveu a URL da sessão de upload.");
  return location;
}

/** Caminho alternativo: o arquivo passa pelo servidor. Só para arquivos pequenos. */
export async function uploadMultipart(input: {
  name: string;
  mimeType: string;
  folderId: string;
  body: ArrayBuffer;
}): Promise<{ id: string; name: string }> {
  const boundary = `mc${Math.random().toString(36).slice(2)}`;
  const metadata = JSON.stringify({ name: input.name, parents: [input.folderId] });
  const encoder = new TextEncoder();

  const head = encoder.encode(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n` +
      `--${boundary}\r\nContent-Type: ${input.mimeType}\r\n\r\n`,
  );
  const tail = encoder.encode(`\r\n--${boundary}--\r\n`);
  const payload = new Uint8Array(head.length + input.body.byteLength + tail.length);
  payload.set(head, 0);
  payload.set(new Uint8Array(input.body), head.length);
  payload.set(tail, head.length + input.body.byteLength);

  const params = new URLSearchParams({
    uploadType: "multipart",
    fields: "id,name",
    ...SHARED_DRIVE_PARAMS,
  });

  const res = await driveFetch(`${UPLOAD_API}/files?${params}`, {
    method: "POST",
    headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
    body: payload,
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Drive ${res.status} no upload: ${detail.slice(0, 300)}`);
  }
  return (await res.json()) as { id: string; name: string };
}

/** Escapa aspas e barras para uso dentro de uma query `name = "..."`. */
function escapeQueryValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

/**
 * Devolve a subpasta com esse nome dentro de `parentId`, criando se não existir.
 *
 * Usada só para a pasta `_originais`, onde o .HEIC original é guardado quando o
 * site publica a versão JPEG. Ela fica DENTRO da pasta do álbum, então:
 *  - não aparece como álbum (álbuns são subpastas da pasta raiz, não do álbum);
 *  - não aparece na galeria (`listFolderImages` só lista arquivos de imagem,
 *    e uma pasta não tem MIME de imagem).
 */
export async function findOrCreateFolder(
  name: string,
  parentId: string,
): Promise<{ id: string; name: string }> {
  const params = new URLSearchParams({
    q: [
      `"${parentId}" in parents`,
      `mimeType = "${FOLDER_MIME}"`,
      `name = "${escapeQueryValue(name)}"`,
      "trashed = false",
    ].join(" and "),
    fields: "files(id,name)",
    pageSize: "1",
    ...SHARED_DRIVE_PARAMS,
  });

  const data = await driveJson<{ files?: { id: string; name: string }[] }>(
    `${API}/files?${params}`,
  );
  const existing = data.files?.[0];
  if (existing) return existing;

  return createFolder(name, parentId);
}

/**
 * Todos os arquivos de uma pasta (imagens, vídeos e documentos), menos as
 * subpastas.
 *
 * Existe só para o painel da organização: assim quem envia um vídeo ou um PDF
 * consegue ver e remover o arquivo. A galeria pública continua usando
 * `listFolderImages`, então nada além de foto aparece para o visitante.
 */
export async function listFolderFiles(
  folderId: string,
  revalidate = 0,
): Promise<DriveFile[]> {
  if (!folderId) return [];

  const files: DriveFile[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      q: [
        `"${folderId}" in parents`,
        `mimeType != "${FOLDER_MIME}"`,
        "trashed = false",
      ].join(" and "),
      fields:
        "nextPageToken, files(id,name,mimeType,size,createdTime,imageMediaMetadata(width,height))",
      orderBy: "name_natural",
      pageSize: "200",
      ...SHARED_DRIVE_PARAMS,
    });
    if (pageToken) params.set("pageToken", pageToken);

    const data = await driveJson<{ files?: DriveFile[]; nextPageToken?: string }>(
      `${API}/files?${params}`,
      undefined,
      revalidate,
    );
    files.push(...(data.files ?? []));
    pageToken = data.nextPageToken;
  } while (pageToken && files.length < 2000);

  return files;
}

/**
 * Procura um arquivo com este nome exato dentro da pasta.
 *
 * É a trava definitiva contra duplicação. Todas as outras (trava de clique,
 * deduplicação da fila, consulta da sessão resumível) são no navegador, e
 * navegador erra: conexão cai depois do último byte, aba dorme no celular, o
 * XHR reporta falha para um envio que na verdade deu certo. Quando isso
 * acontece, o caminho reserva sobe o arquivo de novo e nasce a segunda cópia.
 *
 * Aqui a pergunta é feita à fonte da verdade — o próprio Drive — antes de
 * qualquer byte ser enviado. Se já existe, não envia.
 *
 * A comparação usa nome E tamanho. Só nome bloquearia duas fotos diferentes
 * chamadas IMG_0001.jpg vindas de câmeras diferentes; nome + tamanho idêntico
 * ao byte é, na prática, o mesmo arquivo.
 */
export async function findDuplicateInFolder(
  folderId: string,
  name: string,
  size: number,
): Promise<{ id: string; name: string } | null> {
  const params = new URLSearchParams({
    q: [
      `"${folderId}" in parents`,
      `name = "${escapeQueryValue(name)}"`,
      "trashed = false",
    ].join(" and "),
    fields: "files(id,name,size)",
    pageSize: "20",
    ...SHARED_DRIVE_PARAMS,
  });

  const data = await driveJson<{ files?: { id: string; name: string; size?: string }[] }>(
    `${API}/files?${params}`,
  );

  const match = (data.files ?? []).find((file) => Number(file.size ?? -1) === size);
  return match ? { id: match.id, name: match.name } : null;
}

/** Manda para a lixeira (reversível) em vez de apagar de vez. */
export async function trashFile(fileId: string): Promise<void> {
  const params = new URLSearchParams({ fields: "id", ...SHARED_DRIVE_PARAMS });
  await driveJson(`${API}/files/${fileId}?${params}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ trashed: true }),
  });
}

export async function getStorageQuota(): Promise<StorageQuota | null> {
  try {
    const data = await driveJson<{
      storageQuota?: { limit?: string; usage?: string; usageInDrive?: string };
    }>(`${API}/about?fields=storageQuota`);
    const quota = data.storageQuota;
    if (!quota) return null;
    return {
      limit: quota.limit ? Number(quota.limit) : null,
      usage: Number(quota.usage ?? 0),
      usageInDrive: Number(quota.usageInDrive ?? 0),
    };
  } catch (error) {
    console.error("[drive] falha ao ler a cota", error);
    return null;
  }
}
