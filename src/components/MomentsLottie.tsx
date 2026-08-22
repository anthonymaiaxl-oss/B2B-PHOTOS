"use client";

import { useEffect, useRef, useState } from "react";

/**
 * MOMENTOS: a animação vetorial recolorida para a identidade.
 *
 * É o Lottie original, com a paleta trocada por um script — roxo vira ouro,
 * o lavanda do fundo vira o azul do site, e pele e cabelo ficam como estão,
 * porque pessoa precisa continuar parecendo pessoa.
 *
 * O CUSTO, e por que ele está sob controle
 *
 * O leitor de Lottie e o arquivo somam perto de 100KB comprimidos — mais de
 * meio pacote de JavaScript da home, por causa de um bloco decorativo. Então
 * nada disso entra no carregamento inicial:
 *
 *   1) `import()` dinâmico, disparado por IntersectionObserver com 300px de
 *      antecedência. Quem nunca rola até MOMENTOS não baixa um byte.
 *   2) Enquanto não carrega, e se falhar, fica o painel estático desenhado
 *      aqui embaixo — o bloco nunca aparece vazio.
 *   3) Congela quando sai da tela e quando a aba vai para segundo plano.
 *   4) `prefers-reduced-motion` nem carrega o leitor: mostra o primeiro
 *      quadro parado.
 */
export default function MomentsLottie({ className = "" }: { className?: string }) {
  const caixa = useRef<HTMLDivElement>(null);
  const palco = useRef<HTMLDivElement>(null);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    const alvo = caixa.current;
    if (!alvo) return;

    let anim: { destroy: () => void; play: () => void; pause: () => void; goToAndStop: (v: number, f?: boolean) => void } | null = null;
    let cancelado = false;
    let visivel = false;

    const semMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const avaliar = () => {
      if (!anim) return;
      if (visivel && !document.hidden) anim.play();
      else anim.pause();
    };

    const carregar = async () => {
      try {
        const [{ default: lottie }, dados] = await Promise.all([
          import("lottie-web/build/player/lottie_light"),
          fetch("/secoes/momentos.lottie.json").then((r) => r.json()),
        ]);
        if (cancelado || !palco.current) return;

        anim = lottie.loadAnimation({
          container: palco.current,
          renderer: "svg",
          loop: true,
          autoplay: false,
          animationData: dados,
          rendererSettings: { preserveAspectRatio: "xMidYMid meet", progressiveLoad: true },
        });

        setCarregado(true);

        if (semMovimento) {
          anim.goToAndStop(0, true);
          return;
        }
        avaliar();
      } catch {
        /* fica o painel estático */
      }
    };

    const observador = new IntersectionObserver(
      ([e]) => {
        visivel = e.isIntersecting;
        if (visivel && !anim && !cancelado) carregar();
        avaliar();
      },
      // 300px de antecedência: começa a baixar antes de entrar na tela, para
      // não aparecer o painel vazio e depois a animação surgir de repente.
      { rootMargin: "300px" },
    );
    observador.observe(alvo);
    document.addEventListener("visibilitychange", avaliar);

    return () => {
      cancelado = true;
      observador.disconnect();
      document.removeEventListener("visibilitychange", avaliar);
      anim?.destroy();
    };
  }, []);

  return (
    <div
      ref={caixa}
      className={`relative overflow-hidden ${className}`}
      style={{
        background:
          "radial-gradient(120% 100% at 30% 0%, #142449 0%, #0d1c3c 42%, #091530 74%, #050a18 100%)",
      }}
    >
      <div ref={palco} className="absolute inset-[6%]" aria-hidden="true" />

      {/* Enquanto o vetor não chega, o bloco mostra isto — nunca um vazio. */}
      {!carregado && (
        <div aria-hidden="true" className="absolute inset-0 grid place-items-center">
          <span className="h-px w-[90px] overflow-hidden bg-[#1a2846]">
            <span className="block h-px w-1/2 animate-[shimmer_1.8s_linear_infinite] bg-gradient-to-r from-transparent via-gold to-transparent" />
          </span>
        </div>
      )}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(125% 100% at 50% 45%, transparent 42%, rgba(5,10,24,0.5) 80%, rgba(5,10,24,0.88) 100%)",
        }}
      />
    </div>
  );
}
