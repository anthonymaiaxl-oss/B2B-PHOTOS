import { isAdmin } from "@/lib/admin-auth";
import { exchangeCode } from "@/lib/google-auth";

export const runtime = "nodejs";

function page(title: string, body: string, status = 200): Response {
  return new Response(
    `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>
  :root { color-scheme: dark; }
  body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center;
         background:#05070f; color:#f4f1e8; font:15px/1.6 ui-sans-serif,system-ui,sans-serif; padding:24px; }
  .card { width:min(680px,100%); border:1px solid rgba(212,175,55,.28); border-radius:14px;
          background:linear-gradient(180deg,rgba(16,26,54,.85),rgba(5,7,15,.9)); padding:32px; }
  h1 { margin:0 0 6px; font-size:22px; letter-spacing:-.01em;
       background:linear-gradient(180deg,#fbeaa8,#d4af37 55%,#a9801f);
       -webkit-background-clip:text; background-clip:text; color:transparent; }
  p { color:#9aa3b8; }
  code, textarea { font-family:ui-monospace,SFMono-Regular,Menlo,monospace; }
  textarea { width:100%; min-height:96px; margin-top:8px; padding:12px; border-radius:10px;
             border:1px solid rgba(212,175,55,.3); background:#0a1024; color:#f4f1e8;
             font-size:12px; word-break:break-all; }
  a { color:#e6c65c; }
  ol { padding-left:18px; } li { margin:6px 0; }
</style></head><body><div class="card">${body}</div></body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

/** Passo 2: troca o código pelo refresh token e mostra o valor para colar na Vercel. */
export async function GET(request: Request) {
  if (!(await isAdmin())) {
    return page("Acesso negado", `<h1>Entre no painel primeiro</h1>
      <p>Faça login em <a href="/admin">/admin</a> e clique de novo em “Conectar Google Drive”.</p>`, 401);
  }

  const url = new URL(request.url);
  const error = url.searchParams.get("error");
  if (error) {
    return page("Consentimento cancelado", `<h1>Consentimento cancelado</h1>
      <p>O Google devolveu: <code>${error}</code></p>
      <p><a href="/admin">Voltar ao painel</a></p>`, 400);
  }

  const code = url.searchParams.get("code");
  if (!code) {
    return page("Código ausente", `<h1>Código ausente</h1>
      <p><a href="/api/google/start">Tentar de novo</a></p>`, 400);
  }

  const redirectUri = new URL("/api/google/callback", request.url).toString();
  const result = await exchangeCode(code, redirectUri);

  if (result.error || !result.refresh_token) {
    return page("Não veio refresh token", `<h1>Não veio o refresh token</h1>
      <p>Isso acontece quando a conta já autorizou esta aplicação antes. Remova o acesso em
      <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener">
      myaccount.google.com/permissions</a> e refaça a conexão.</p>
      <p><code>${result.error ? String(result.error).slice(0, 300) : "sem refresh_token na resposta"}</code></p>
      <p><a href="/api/google/start">Tentar de novo</a></p>`, 400);
  }

  return page(
    "Drive conectado",
    `<h1>Refresh token gerado</h1>
     <p>Copie o valor abaixo e cole na Vercel em <b>Settings → Environment Variables</b>
        como <code>GOOGLE_REFRESH_TOKEN</code>. Depois, <b>Redeploy</b>.</p>
     <textarea readonly onclick="this.select()">${result.refresh_token}</textarea>
     <ol>
       <li>Vercel → seu projeto → Settings → Environment Variables</li>
       <li>Name: <code>GOOGLE_REFRESH_TOKEN</code> · Value: o texto acima</li>
       <li>Deployments → ⋯ → Redeploy</li>
     </ol>
     <p>Este token não expira sozinho. Guarde como senha: quem tiver ele acessa o seu Drive.</p>
     <p><a href="/admin">Voltar ao painel</a></p>`,
  );
}
