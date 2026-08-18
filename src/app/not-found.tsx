import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <span className="font-[family-name:var(--font-plex)] text-[10px] tracking-[0.24em] text-violet-bright">
        404
      </span>
      <h1 className="m-0 text-[clamp(30px,8vw,64px)] font-semibold tracking-[-0.03em]">
        Este momento não existe.
      </h1>
      <p className="m-0 max-w-sm text-sm leading-relaxed text-muted">
        O álbum que você procura não está disponível.
      </p>
      <Link
        href="/"
        className="flex min-h-12 items-center rounded-full border border-[#26232f] px-7 font-[family-name:var(--font-plex)] text-[10px] tracking-[0.2em] transition-colors duration-300 hover:border-violet"
      >
        VOLTAR PARA A HOME
      </Link>
    </main>
  );
}
