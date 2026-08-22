"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { eventConfig } from "@/config/event";
import { EASE } from "@/lib/motion";

/**
 * A abertura do site.
 *
 * As palavras do evento entram e saem no centro, uma de cada vez, e a última
 * — o nome, em ouro — sai por um arco que varre a tela para cima e revela a
 * página. É a mesma ideia do "Arc Preloader": o corte curvo é o que separa
 * isto de um simples fade.
 *
 * Duas travas que evitam que uma abertura bonita vire estorvo:
 *
 *   1) Só na home. Quem abre o link de um álbum direto — que é o caso de quem
 *      recebeu o link no WhatsApp — não espera 3,5s por uma apresentação.
 *   2) Uma vez por sessão. Sem isso ela tocaria de novo a cada recarga e a
 *      cada volta do navegador.
 *
 * Nos dois casos de exceção o componente não renderiza nada: nem fade, nem
 * quadro preto. O site simplesmente aparece.
 */

/** Quanto cada palavra fica na tela, em milissegundos. */
const TEMPO_PALAVRA = 560;

/** A última é o nome do evento: fica um pouco mais. */
const TEMPO_ULTIMA = 900;

/** Chave da trava de sessão. */
const JA_VIU = "b2b:abertura";

export default function Preloader() {
  const reduzido = useReducedMotion();
  const rota = usePathname();
  const palavras = eventConfig.intro;

  // `null` = ainda decidindo se toca. Evita o flash de um quadro preto antes
  // de saber se esta sessão já viu a abertura.
  const [indice, setIndice] = useState<number | null>(null);
  const [saindo, setSaindo] = useState(false);

  useEffect(() => {
    const pular =
      rota !== "/" || reduzido || sessionStorage.getItem(JA_VIU) === "1";

    if (pular) {
      setIndice(-1);
      return;
    }

    sessionStorage.setItem(JA_VIU, "1");
    setIndice(0);
  }, [rota, reduzido]);

  useEffect(() => {
    if (indice === null || indice < 0) return;

    const ultima = indice === palavras.length - 1;
    const espera = ultima ? TEMPO_ULTIMA : TEMPO_PALAVRA;

    const t = window.setTimeout(() => {
      if (ultima) setSaindo(true);
      else setIndice(indice + 1);
    }, espera);

    return () => window.clearTimeout(t);
  }, [indice, palavras.length]);

  // Enquanto a abertura está na tela, a página atrás não deve rolar.
  useEffect(() => {
    const tocando = indice !== null && indice >= 0 && !saindo;
    if (!tocando) return;
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = antes;
    };
  }, [indice, saindo]);

  const tocando = indice !== null && indice >= 0;

  return (
    <AnimatePresence>
      {tocando && !saindo && (
        <motion.div
          key="abertura"
          aria-hidden="true"
          initial={{ y: 0 }}
          exit={{ y: "-102%" }}
          transition={{ duration: 0.78, ease: [0.76, 0, 0.24, 1] }}
          /* O arco: a borda de baixo é uma elipse rasa. Quando o painel sobe,
             é essa curva que varre a tela — o mesmo efeito do original, feito
             só com border-radius e translate, ou seja, na GPU. */
          style={{ borderRadius: "0 0 50% 50% / 0 0 14% 14%" }}
          className="fixed inset-0 z-[120] overflow-hidden bg-ink"
        >
          {/* Um brilho dourado fraco atrás do texto, para o preto não ficar
              chapado enquanto as palavras passam. */}
          <span
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(212,175,55,0.13), rgba(212,175,55,0) 68%)",
            }}
          />

          {/* `grid` com todas as palavras na MESMA célula, em vez de
              `mode="popLayout"`. Com popLayout a que sai é tirada do fluxo e,
              em trocas rápidas como estas, sobrava um vão: NETWORKING e
              ESTRATÉGIA simplesmente não apareciam. Empilhadas na mesma
              célula, a que sai e a que entra se cruzam e o centro nunca fica
              vazio. */}
          <div className="absolute inset-0 grid place-items-center px-[22px]">
            <AnimatePresence>
              <motion.span
                key={indice}
                initial={{ opacity: 0, y: 22, filter: "blur(12px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -18, filter: "blur(10px)" }}
                transition={{ duration: 0.42, ease: EASE }}
                className={`col-start-1 row-start-1 ${
                  indice === palavras.length - 1
                    ? "text-gold-gradient text-center text-[clamp(34px,10vw,96px)] font-extrabold leading-[0.95] tracking-[-0.035em]"
                    : "text-center text-[clamp(20px,5.2vw,44px)] font-bold tracking-[0.16em] text-[#8d9ab8]"
                }`}
              >
                {palavras[indice]}
              </motion.span>
            </AnimatePresence>
          </div>

          {/* Filete que enche ao longo da sequência: mostra que tem fim. */}
          <span className="absolute bottom-[13%] left-1/2 h-px w-[140px] -translate-x-1/2 overflow-hidden bg-[#161f36]">
            <motion.span
              className="block h-px origin-left bg-gradient-to-r from-gold-deep via-gold to-gold-bright"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: (indice + 1) / palavras.length }}
              transition={{ duration: 0.42, ease: EASE }}
            />
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
