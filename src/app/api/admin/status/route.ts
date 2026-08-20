import { guardAdmin } from "@/lib/admin-auth";
import { getStorageQuota } from "@/lib/drive";
import { getGoogleCreds, getRootFolderId } from "@/lib/google-auth";

export const runtime = "nodejs";

/** Diz ao painel exatamente o que ainda falta configurar. */
export async function GET() {
  const denied = await guardAdmin();
  if (denied) return denied;

  const creds = getGoogleCreds();
  const rootFolderId = getRootFolderId();
  const hasClient = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

  const missing: string[] = [];
  if (!process.env.GOOGLE_CLIENT_ID) missing.push("GOOGLE_CLIENT_ID");
  if (!process.env.GOOGLE_CLIENT_SECRET) missing.push("GOOGLE_CLIENT_SECRET");
  if (!process.env.GOOGLE_REFRESH_TOKEN) missing.push("GOOGLE_REFRESH_TOKEN");
  if (!rootFolderId) missing.push("GOOGLE_DRIVE_ROOT_FOLDER_ID");

  const connected = Boolean(creds);
  const quota = connected ? await getStorageQuota() : null;

  return Response.json({
    hasClient,
    connected,
    ready: connected && Boolean(rootFolderId),
    rootFolderId,
    missing,
    quota,
  });
}
