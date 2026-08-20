import { guardAdmin } from "@/lib/admin-auth";
import { uploadMultipart } from "@/lib/drive";
import { isDriveConfigured } from "@/lib/google-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Limite prático das functions da Vercel (4,5 MB) com folga. */
const MAX_BYTES = 4 * 1024 * 1024;

/**
 * Caminho reserva: usado só se o envio direto para o Google falhar
 * (rede corporativa que bloqueia googleapis.com, por exemplo).
 */
export async function POST(request: Request) {
  const denied = await guardAdmin();
  if (denied) return denied;

  if (!isDriveConfigured()) {
    return Response.json({ error: "Google Drive não configurado." }, { status: 503 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const file = form.get("file");
  const folderId = String(form.get("folderId") ?? "");
  const name = String(form.get("name") ?? "");

  if (!(file instanceof File) || !folderId || !name) {
    return Response.json({ error: "Dados do arquivo incompletos." }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return Response.json({ error: "Só é possível enviar imagens." }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json(
      { error: "Arquivo grande demais para o caminho reserva. Ative a otimização no envio." },
      { status: 413 },
    );
  }

  try {
    const created = await uploadMultipart({
      name,
      mimeType: file.type,
      folderId,
      body: await file.arrayBuffer(),
    });
    return Response.json({ ok: true, file: created });
  } catch (error) {
    console.error("[admin/upload]", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Falha no envio." },
      { status: 502 },
    );
  }
}
