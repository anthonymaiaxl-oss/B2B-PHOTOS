import { getFileMeta, getFileStream } from "@/lib/drive";
import { isDriveConfigured } from "@/lib/google-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Nome de arquivo seguro para o header Content-Disposition. */
function safeName(name: string): string {
  const clean = name.replace(/[\\/:*?"<>|\r\n]+/g, "-").trim() || "foto.jpg";
  return clean.length > 120 ? clean.slice(-120) : clean;
}

/**
 * Download de verdade: baixa o arquivo original com o nome certo,
 * sem abrir aba nova e sem a tela de aviso do Google Drive.
 * Como é do mesmo domínio, também permite o navegador montar o .zip.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!isDriveConfigured()) {
    return new Response("Google Drive não configurado.", { status: 503 });
  }
  if (!/^[A-Za-z0-9_-]{10,}$/.test(id)) {
    return new Response("Id inválido.", { status: 400 });
  }

  try {
    const [meta, upstream] = await Promise.all([getFileMeta(id), getFileStream(id)]);

    if (!upstream.ok || !upstream.body) {
      return new Response("Foto não encontrada.", { status: 404 });
    }

    const filename = safeName(meta.name);
    const headers = new Headers({
      "Content-Type": meta.mimeType || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "private, max-age=3600",
    });
    const length = upstream.headers.get("content-length");
    if (length) headers.set("Content-Length", length);

    return new Response(upstream.body, { headers });
  } catch (error) {
    console.error("[download] falha", id, error);
    return new Response("Falha ao baixar a foto.", { status: 502 });
  }
}
