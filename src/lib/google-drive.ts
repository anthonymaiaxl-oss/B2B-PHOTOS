import { REVALIDATE_SECONDS, eventConfig } from "@/config/event";
import type { DriveFile, Photo } from "@/types";
import { mockPhotos } from "./mock-data";

const DRIVE_ENDPOINT = "https://www.googleapis.com/drive/v3/files";

const useMock = () =>
  process.env.NEXT_PUBLIC_USE_MOCK === "true" || !process.env.GOOGLE_DRIVE_API_KEY;

export function getPhotoThumbnailUrl(fileId: string, width = 800): string {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${width}`;
}

export function getPhotoPreviewUrl(fileId: string, width = 2000): string {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${width}`;
}

export function getPhotoDownloadUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

function toPhoto(file: DriveFile): Photo {
  return {
    id: file.id,
    name: file.name.replace(/\.[^.]+$/, ""),
    thumbnailUrl: getPhotoThumbnailUrl(file.id),
    previewUrl: getPhotoPreviewUrl(file.id),
    downloadUrl: getPhotoDownloadUrl(file.id),
    width: file.imageMediaMetadata?.width,
    height: file.imageMediaMetadata?.height,
  };
}

/** Lista os arquivos de imagem de uma pasta do Drive (paginado, somente leitura). */
export async function getFolderFiles(folderId: string): Promise<DriveFile[]> {
  const key = process.env.GOOGLE_DRIVE_API_KEY;
  if (!key || !folderId) return [];

  const files: DriveFile[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`,
      fields: "nextPageToken, files(id,name,mimeType,imageMediaMetadata(width,height))",
      orderBy: "name_natural",
      pageSize: "200",
      key,
    });
    if (pageToken) params.set("pageToken", pageToken);

    const res = await fetch(`${DRIVE_ENDPOINT}?${params}`, {
      next: { revalidate: REVALIDATE_SECONDS },
    });

    if (!res.ok) {
      console.error(`[drive] ${res.status} ao listar a pasta ${folderId}`);
      return files;
    }

    const data = (await res.json()) as { files?: DriveFile[]; nextPageToken?: string };
    files.push(...(data.files ?? []));
    pageToken = data.nextPageToken;
  } while (pageToken);

  return files;
}

/** Fotos de um álbum configurado em src/config/event.ts. */
export async function getAlbumPhotos(albumId: string): Promise<Photo[]> {
  if (useMock()) return mockPhotos(albumId);

  const album = eventConfig.albums.find((a) => a.id === albumId);
  if (!album?.folderId) return [];

  try {
    const files = await getFolderFiles(album.folderId);
    return files.map(toPhoto);
  } catch (error) {
    console.error("[drive] falha ao carregar álbum", albumId, error);
    return [];
  }
}

/** Todos os álbuns com as fotos já resolvidas (usado na home). */
export async function getAllAlbums() {
  return Promise.all(
    eventConfig.albums.map(async (album) => {
      const photos = await getAlbumPhotos(album.id);
      return { ...album, photos, cover: photos[0] ?? null };
    }),
  );
}
