import { guardAdmin } from "@/lib/admin-auth";
import { createResumableSession } from "@/lib/drive";
import { isDriveConfigured } from "@/lib/google-auth";

export const runtime = "nodejs";

/**
 * Abre a sessão de upload no Google e devolve só a URL dela.
 * O navegador manda os bytes direto para o Google: nenhum arquivo passa por
 * aqui (sem o limite de 4,5 MB da Vercel) e o token continua no servidor.
 */
export async function POST(request: Request) {
  const denied = await guardAdmin();
  if (denied) return denied;

  if (!isDriveConfigured()) {
    return Response.json({ error: "Google Drive não configurado." }, { status: 503 });
  }

  let body: { name?: string; mimeType?: string; size?: number; folderId?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const { name, mimeType, size, folderId } = body;
  if (!name || !mimeType || !folderId || !size) {
    return Response.json({ error: "Dados do arquivo incompletos." }, { status: 400 });
  }
  if (!mimeType.startsWith("image/")) {
    return Response.json({ error: "Só é possível enviar imagens." }, { status: 415 });
  }
  if (size > 200 * 1024 * 1024) {
    return Response.json({ error: "Arquivo acima de 200 MB." }, { status: 413 });
  }

  try {
    const uploadUrl = await createResumableSession({ name, mimeType, size, folderId });
    return Response.json({ uploadUrl });
  } catch (error) {
    console.error("[admin/upload-session]", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Falha ao abrir a sessão de upload." },
      { status: 502 },
    );
  }
}
