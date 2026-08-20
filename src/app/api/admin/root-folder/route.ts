import { guardAdmin } from "@/lib/admin-auth";
import { createFolder } from "@/lib/drive";
import { getGoogleCreds } from "@/lib/google-auth";

export const runtime = "nodejs";

/**
 * Cria a pasta raiz do site direto no Drive e devolve o ID,
 * para não precisar caçar o ID na URL do navegador.
 */
export async function POST(request: Request) {
  const denied = await guardAdmin();
  if (denied) return denied;

  if (!getGoogleCreds()) {
    return Response.json({ error: "Conecte o Google Drive antes." }, { status: 503 });
  }

  let name = "MASTER CLASS REFORMA TRIBUTÁRIA — FOTOS";
  try {
    const body = (await request.json()) as { name?: string };
    if (body.name && body.name.trim().length >= 2) name = body.name.trim();
  } catch {
    /* usa o nome padrão */
  }

  try {
    const folder = await createFolder(name, "root");
    return Response.json({ ok: true, folder });
  } catch (error) {
    console.error("[admin/root-folder]", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Falha ao criar a pasta." },
      { status: 502 },
    );
  }
}
