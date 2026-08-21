import { guardAdmin } from "@/lib/admin-auth";
import { MAX_FALLBACK_BYTES, validateUpload } from "@/config/uploads";
import { findDuplicateInFolder, uploadMultipart } from "@/lib/drive";
import { isDriveConfigured } from "@/lib/google-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Caminho reserva: usado só se o envio direto para o Google falhar
 * (rede corporativa que bloqueia googleapis.com, por exemplo).
 *
 * O teto continua sendo o limite prático das functions da Vercel (4,5 MB) com
 * folga — mesmo valor de antes, agora vindo de MAX_FALLBACK_BYTES. A checagem
 * `file.type.startsWith("image/")` virou a allowlist compartilhada para que
 * vídeo e documento também tenham caminho reserva.
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

  if (file.size > MAX_FALLBACK_BYTES) {
    return Response.json(
      { error: "Arquivo grande demais para o caminho reserva. Ative a otimização no envio." },
      { status: 413 },
    );
  }

  const check = validateUpload(name, file.type, file.size, MAX_FALLBACK_BYTES);
  if (!check.ok) {
    return Response.json({ error: check.reason }, { status: 415 });
  }

  try {
    // Mesma trava da rota de sessão. Este caminho é justamente o que criava a
    // segunda cópia, então ele precisa checar antes de escrever.
    const existing = await findDuplicateInFolder(folderId, name, file.size);
    if (existing) {
      console.info("[admin/upload] já existe, envio ignorado:", name);
      return Response.json({ ok: true, duplicate: true, file: existing });
    }

    const created = await uploadMultipart({
      name,
      mimeType: file.type || "application/octet-stream",
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
