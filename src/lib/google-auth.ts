const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";

/** Escopo completo do Drive: precisamos criar pastas, enviar e apagar arquivos. */
export const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive";

export interface GoogleCreds {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

/** Lê as credenciais do ambiente. Retorna null se faltar alguma. */
export function getGoogleCreds(): GoogleCreds | null {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) return null;
  return { clientId, clientSecret, refreshToken };
}

export function isDriveConfigured(): boolean {
  return Boolean(getGoogleCreds() && process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID);
}

export function getRootFolderId(): string {
  return process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID ?? "";
}

// Cache de processo. Sobrevive entre requisições na mesma instância serverless
// e evita pedir um access token novo a cada thumbnail.
let cached: { token: string; expiresAt: number } | null = null;

/**
 * Troca o refresh token por um access token (válido ~1h).
 * Lança se as credenciais estiverem ausentes ou o Google recusar.
 */
export async function getAccessToken(): Promise<string> {
  if (cached && Date.now() < cached.expiresAt) return cached.token;

  const creds = getGoogleCreds();
  if (!creds) throw new Error("GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN ausentes.");

  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
      refresh_token: creds.refreshToken,
      grant_type: "refresh_token",
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text();
    cached = null;
    throw new Error(`Falha ao renovar o token do Google (${res.status}): ${detail.slice(0, 300)}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cached = {
    token: data.access_token,
    // 60s de folga para não usar um token que expira no meio da chamada.
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return cached.token;
}

/** URL de consentimento — usada uma única vez para gerar o refresh token. */
export function buildConsentUrl(redirectUri: string, clientId: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: DRIVE_SCOPE,
    access_type: "offline",
    // Obriga o Google a devolver um refresh_token mesmo que já exista consentimento.
    prompt: "consent",
    include_granted_scopes: "true",
  });
  return `${AUTH_ENDPOINT}?${params}`;
}

/** Troca o `code` do callback pelo refresh token definitivo. */
export async function exchangeCode(
  code: string,
  redirectUri: string,
): Promise<{ refresh_token?: string; access_token?: string; error?: string }> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return { error: "GOOGLE_CLIENT_ID/SECRET ausentes." };

  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
    cache: "no-store",
  });

  const data = await res.json();
  if (!res.ok) return { error: JSON.stringify(data).slice(0, 400) };
  return data;
}
