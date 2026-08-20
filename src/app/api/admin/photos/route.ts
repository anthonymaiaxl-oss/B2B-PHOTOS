import { guardAdmin } from "@/lib/admin-auth";
import { listFolderImages, trashFile } from "@/lib/drive";
import { isDriveConfigured } from "@/lib/google-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Fotos de uma pasta, sem cache — o painel precisa do estado real agora. */
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
    const files = await listFolderImages(folderId, 0);
    return Response.json({
      photos: files.map((file) => ({
        id: file.id,
        name: file.name,
        size: file.size ? Number(file.size) : 0,
        thumbnailUrl: `/api/photo/${file.id}?w=400`,
      })),
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
