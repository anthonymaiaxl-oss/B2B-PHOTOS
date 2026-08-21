import { guardAdmin } from "@/lib/admin-auth";
import { ORIGINALS_FOLDER } from "@/config/uploads";
import { findOrCreateFolder } from "@/lib/drive";
import { isDriveConfigured } from "@/lib/google-auth";

export const runtime = "nodejs";

/**
 * Devolve (criando na primeira vez) a subpasta `_originais` de um álbum.
 *
 * Serve ao requisito do briefing de preservar o .HEIC original no Drive e usar
 * o JPEG apenas como versão visualizável. Guardar o original DENTRO da pasta do
 * álbum, numa subpasta, é o que mantém tudo invisível para o site:
 *
 *  - `listAlbums` só enxerga subpastas da pasta RAIZ, então `_originais` nunca
 *    vira um álbum;
 *  - `listFolderImages` filtra por `mimeType contains 'image/'`, e uma pasta
 *    não tem MIME de imagem — logo o conteúdo dela não entra na galeria.
 *
 * Nenhuma rota, variável de ambiente ou estrutura existente foi alterada para
 * isso: é só uma pasta a mais dentro do Drive que já está configurado.
 */
export async function POST(request: Request) {
  const denied = await guardAdmin();
  if (denied) return denied;

  if (!isDriveConfigured()) {
    return Response.json({ error: "Google Drive não configurado." }, { status: 503 });
  }

  let albumFolderId = "";
  try {
    const body = (await request.json()) as { albumFolderId?: string };
    albumFolderId = (body.albumFolderId ?? "").trim();
  } catch {
    return Response.json({ error: "Requisição inválida." }, { status: 400 });
  }

  if (!/^[A-Za-z0-9_-]{10,}$/.test(albumFolderId)) {
    return Response.json({ error: "Álbum inválido." }, { status: 400 });
  }

  try {
    const folder = await findOrCreateFolder(ORIGINALS_FOLDER, albumFolderId);
    return Response.json({ ok: true, folderId: folder.id });
  } catch (error) {
    console.error("[admin/originals-folder]", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Falha ao preparar a pasta." },
      { status: 502 },
    );
  }
}
