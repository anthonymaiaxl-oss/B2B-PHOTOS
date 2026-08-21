import { guardAdmin } from "@/lib/admin-auth";
import { MAX_UPLOAD_BYTES, validateUpload } from "@/config/uploads";
import { createResumableSession } from "@/lib/drive";
import { isDriveConfigured } from "@/lib/google-auth";

export const runtime = "nodejs";

/**
 * Abre a sessão de upload no Google e devolve só a URL dela.
 * O navegador manda os bytes direto para o Google: nenhum arquivo passa por
 * aqui (sem o limite de 4,5 MB da Vercel) e o token continua no servidor.
 *
 * A validação deixou de ser `mimeType.startsWith("image/")` e passou a usar a
 * allowlist de `src/config/uploads.ts` — a mesma do painel. Foi a mudança
 * mínima necessária para aceitar vídeo e documento sem afrouxar a segurança:
 * a extensão precisa estar na lista E o MIME informado precisa bater com ela.
 * O teto de 200 MB é exatamente o que já existia aqui, só que agora vem da
 * constante compartilhada.
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

  const check = validateUpload(name, mimeType, size, MAX_UPLOAD_BYTES);
  if (!check.ok) {
    // 413 para tamanho, 415 para formato — o painel usa isso na mensagem.
    const tooLarge = size > MAX_UPLOAD_BYTES;
    return Response.json({ error: check.reason }, { status: tooLarge ? 413 : 415 });
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
