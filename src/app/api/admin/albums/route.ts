import { guardAdmin } from "@/lib/admin-auth";
import { createFolder, listAlbums, listFolderImages } from "@/lib/drive";
import { getRootFolderId, isDriveConfigured } from "@/lib/google-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Álbuns + contagem real de fotos, sem passar pelo cache do site. */
export async function GET() {
  const denied = await guardAdmin();
  if (denied) return denied;

  if (!isDriveConfigured()) {
    return Response.json({ albums: [], configured: false });
  }

  try {
    const albums = await listAlbums();
    const withCounts = await Promise.all(
      albums.map(async (album) => ({
        ...album,
        count: (await listFolderImages(album.folderId, 0)).length,
      })),
    );
    return Response.json({ albums: withCounts, configured: true });
  } catch (error) {
    console.error("[admin/albums] GET", error);
    return Response.json({ error: mensagem(error) }, { status: 502 });
  }
}

/** Cria um álbum = cria uma subpasta na pasta raiz do Drive. */
export async function POST(request: Request) {
  const denied = await guardAdmin();
  if (denied) return denied;

  const root = getRootFolderId();
  if (!root) {
    return Response.json({ error: "GOOGLE_DRIVE_ROOT_FOLDER_ID não configurado." }, { status: 503 });
  }

  let name = "";
  try {
    const body = (await request.json()) as { name?: string };
    name = (body.name ?? "").trim();
  } catch {
    return Response.json({ error: "Requisição inválida." }, { status: 400 });
  }

  if (name.length < 2 || name.length > 80) {
    return Response.json({ error: "O nome do álbum precisa ter entre 2 e 80 caracteres." }, { status: 400 });
  }

  try {
    const folder = await createFolder(name, root);
    return Response.json({ ok: true, folder });
  } catch (error) {
    console.error("[admin/albums] POST", error);
    return Response.json({ error: mensagem(error) }, { status: 502 });
  }
}

function mensagem(error: unknown): string {
  return error instanceof Error ? error.message : "Erro desconhecido no Google Drive.";
}
