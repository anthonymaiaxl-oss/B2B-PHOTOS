import { isAdmin } from "@/lib/admin-auth";
import { buildConsentUrl } from "@/lib/google-auth";

export const runtime = "nodejs";

/** Passo 1 da conexão com o Drive: manda para a tela de consentimento do Google. */
export async function GET(request: Request) {
  if (!(await isAdmin())) {
    return Response.redirect(new URL("/admin", request.url), 302);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return new Response("Defina GOOGLE_CLIENT_ID antes de conectar.", { status: 503 });
  }

  const redirectUri = new URL("/api/google/callback", request.url).toString();
  return Response.redirect(buildConsentUrl(redirectUri, clientId), 302);
}
