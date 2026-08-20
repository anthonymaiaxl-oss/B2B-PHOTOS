import { cookies } from "next/headers";
import {
  ADMIN_COOKIE,
  SESSION_MAX_AGE,
  checkPassword,
  createSessionValue,
  isAdminConfigured,
} from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isAdminConfigured()) {
    return Response.json(
      { error: "Falta definir ADMIN_PASSWORD nas variáveis de ambiente." },
      { status: 503 },
    );
  }

  let password = "";
  try {
    const body = (await request.json()) as { password?: string };
    password = body.password ?? "";
  } catch {
    return Response.json({ error: "Requisição inválida." }, { status: 400 });
  }

  if (!checkPassword(password)) {
    // Atraso curto: encarece tentativa de força bruta sem travar o uso normal.
    await new Promise((resolve) => setTimeout(resolve, 600));
    return Response.json({ error: "Senha incorreta." }, { status: 401 });
  }

  const store = await cookies();
  store.set(ADMIN_COOKIE, createSessionValue(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  return Response.json({ ok: true });
}
