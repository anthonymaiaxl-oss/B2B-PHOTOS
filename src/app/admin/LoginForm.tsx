"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Lock } from "lucide-react";
import { eventConfig } from "@/config/event";
import EventSeal from "@/components/EventSeal";

export default function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error ?? "Não foi possível entrar.");
        return;
      }
      router.refresh();
    } catch {
      setError("Falha de conexão. Tente de novo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto flex w-full max-w-[420px] flex-col items-center gap-7 py-10">
      <EventSeal className="h-auto w-[150px] opacity-90" />

      <div className="flex flex-col items-center gap-1.5 text-center">
        <h1 className="m-0 text-xl font-extrabold tracking-[-0.01em] text-white">
          Área da organização
        </h1>
        <p className="m-0 text-[13px] text-muted">
          Envio e gestão das fotos do {eventConfig.name}.
        </p>
      </div>

      <form onSubmit={submit} className="flex w-full flex-col gap-3">
        <label htmlFor="senha" className="sr-only">
          Senha
        </label>
        <div className="relative">
          <Lock
            size={15}
            strokeWidth={1.6}
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gold/70"
          />
          <input
            id="senha"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Senha"
            required
            className="h-[52px] w-full rounded-full border border-gold/25 bg-navy/60 pl-11 pr-5 text-sm text-white outline-none transition-colors duration-300 placeholder:text-[#5b678a] focus:border-gold"
          />
        </div>

        <button
          type="submit"
          disabled={loading || password.length === 0}
          className="flex h-[52px] items-center justify-center gap-2 rounded-full border border-gold bg-gradient-to-b from-gold-bright to-gold text-[11px] font-bold tracking-[0.2em] text-ink transition-all duration-300 hover:from-white hover:to-gold-bright disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading && <Loader2 size={15} className="animate-spin" />}
          {loading ? "ENTRANDO…" : "ENTRAR"}
        </button>

        {error && (
          <p role="alert" className="m-0 text-center text-[13px] text-[#ff9d9d]">
            {error}
          </p>
        )}
      </form>
    </section>
  );
}
