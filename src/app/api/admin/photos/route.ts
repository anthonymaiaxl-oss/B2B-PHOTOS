import { guardAdmin } from "@/lib/admin-auth";
import { kindOf } from "@/config/uploads";
import { listFolderFiles, trashFile } from "@/lib/drive";
import { isDriveConfigured } from "@/lib/google-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Arquivos de uma pasta, sem cache — o painel precisa do estado real agora.
 *
 * Passou a usar `listFolderFiles` (tudo, menos subpastas) no lugar de
 * `listFolderImages`. Motivo: agora que vídeo e documento podem ser enviados,
 * eles precisam aparecer no painel para poderem ser conferidos e removidos.
 * A galeria pública NÃO mudou — ela continua em `listFolderImages` e segue
 * mostrando só fotos.
 */
export async function GET(request: Request) {
  const denied = await guardAdmin();
  if (denied) return denied;

  if (!isDriveConfigured()) {
    return Response.json({ photos: [] });
  }

  const folderId = new URL(request.url).searchParams.get("folderId");
  if (!folderId) {
    return Response.json({ error: "folderId ausente." }, { status: 400 });
  }

  try {
    const files = await listFolderFiles(folderId, 0);
    return Response.json({
      photos: files.map((file) => {
        const isImage = (file.mimeType ?? "").startsWith("image/");
        return {
          id: file.id,
          name: file.name,
          size: file.size ? Number(file.size) : 0,
          kind: kindOf(file.name) ?? (isImage ? "imagem" : "documento"),
          // Só imagem tem miniatura: /api/photo usa o sharp, que não abre
          // vídeo nem PDF. Para os outros o painel desenha um bloco com a
          // extensão em vez de pedir uma imagem que voltaria com erro.
          thumbnailUrl: isImage ? `/api/photo/${file.id}?w=400` : null,
        };
      }),
    });
  } catch (error) {
    console.error("[admin/photos] GET", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Falha ao listar." },
      { status: 502 },
    );
  }
}

/** Manda a foto para a lixeira do Drive (dá para restaurar por 30 dias). */
export async function DELETE(request: Request) {
  const denied = await guardAdmin();
  if (denied) return denied;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "id ausente." }, { status: 400 });

  try {
    await trashFile(id);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[admin/photos] DELETE", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Falha ao remover." },
      { status: 502 },
    );
  }
}
