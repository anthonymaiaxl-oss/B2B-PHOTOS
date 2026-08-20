import type { Metadata } from "next";
import Link from "next/link";
import { eventConfig } from "@/config/event";
import { isAdmin, isAdminConfigured } from "@/lib/admin-auth";
import AdminPanel from "./AdminPanel";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: `Área da organização — ${eventConfig.brand}`,
  robots: { index: false, follow: false },
};

// Sempre no servidor, sempre agora: nada aqui pode vir de cache.
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const configured = isAdminConfigured();
  const authenticated = configured && (await isAdmin());

  return (
    <main className="relative z-[2] flex min-h-screen flex-col px-[22px] py-10">
      <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="block h-1.5 w-1.5 rotate-45 bg-gold" />
            <span className="text-[11px] font-bold tracking-[0.3em] text-white">
              {eventConfig.brand.toUpperCase()}
            </span>
          </Link>
          <span className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.2em] text-gold">
            ÁREA DA ORGANIZAÇÃO
          </span>
        </header>

        <div className="gold-rule" />

        {!configured ? (
          <section className="gold-border rounded-xl bg-navy/40 p-8">
            <h1 className="text-gold-gradient m-0 mb-3 text-2xl font-extrabold">
              Falta configurar a senha
            </h1>
            <p className="m-0 text-sm leading-relaxed text-muted">
              Defina a variável de ambiente <code className="text-gold">ADMIN_PASSWORD</code>{" "}
              na Vercel (Settings → Environment Variables) e faça um Redeploy. Enquanto ela
              não existir, esta área fica bloqueada para todo mundo.
            </p>
          </section>
        ) : authenticated ? (
          <AdminPanel />
        ) : (
          <LoginForm />
        )}
      </div>
    </main>
  );
}
