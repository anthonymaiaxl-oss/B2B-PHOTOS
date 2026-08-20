import { revalidatePath } from "next/cache";
import { guardAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";

/**
 * Publica na hora. Sem isso, as fotos novas só apareceriam
 * quando o cache de 10 minutos vencesse.
 */
export async function POST() {
  const denied = await guardAdmin();
  if (denied) return denied;

  revalidatePath("/", "layout");
  return Response.json({ ok: true, at: new Date().toISOString() });
}
