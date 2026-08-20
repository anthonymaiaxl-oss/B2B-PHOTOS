import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "mc_admin";
const SESSION_HOURS = 12;

function secret(): string {
  // ADMIN_SESSION_SECRET é opcional: sem ele, a própria senha assina o cookie.
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "";
}

export function isAdminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD);
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

/** Comparação em tempo constante — não vaza o tamanho do prefixo correto. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function checkPassword(candidate: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return safeEqual(candidate, expected);
}

export function createSessionValue(): string {
  const expiresAt = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
  return `${expiresAt}.${sign(String(expiresAt))}`;
}

export const SESSION_MAX_AGE = SESSION_HOURS * 60 * 60;

function isValidSession(value: string | undefined): boolean {
  if (!value || !secret()) return false;
  const [expiresAt, signature] = value.split(".");
  if (!expiresAt || !signature) return false;
  if (Number(expiresAt) < Date.now()) return false;
  return safeEqual(signature, sign(expiresAt));
}

/** Server Components e Route Handlers: sessão válida? */
export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return isValidSession(store.get(ADMIN_COOKIE)?.value);
}

/** Atalho para rotas: devolve null se ok, ou a resposta 401 pronta. */
export async function guardAdmin(): Promise<Response | null> {
  if (await isAdmin()) return null;
  return Response.json({ error: "Sessão expirada. Entre novamente." }, { status: 401 });
}
