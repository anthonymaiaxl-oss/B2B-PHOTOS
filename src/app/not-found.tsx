import Link from "next/link";

export default function NotFound() {
  return (
    <main className="relative z-[2] flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <span className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.24em] text-gold">
        404
      </span>
      <h1 className="text-gold-gradient m-0 text-[clamp(30px,8vw,64px)] font-extrabold tracking-[-0.03em]">
        Este momento não existe.
      </h1>
      <p className="m-0 max-w-sm text-sm leading-relaxed text-muted">
        O álbum que você procura não está disponível.
      </p>
      <Link
        href="/"
        className="flex min-h-12 items-center rounded-full border border-gold/30 px-7 font-[family-name:var(--font-mono)] text-[10px] tracking-[0.2em] text-muted transition-colors duration-300 hover:border-gold hover:text-white"
      >
        VOLTAR PARA O INÍCIO
      </Link>
    </main>
  );
}
