"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

/**
 * A linha estratégica do capítulo ESTRATÉGIA.
 *
 * Não é imagem nem vídeo: é SVG desenhado no navegador, então acompanha o
 * tamanho do bloco em vez de ser esticado dentro dele. Dois traçados, um para
 * cada formato do quadro (16/9 no desktop, 4/3 no celular) — no celular a
 * linha é mais curta e mais íngreme, senão ela ficaria espremida.
 *
 * O ciclo tem 16s e conta uma história: a linha nasce quase invisível, é
 * desenhada da esquerda para a direita, e cada um dos quatro pontos acende com
 * um pulso quando ela chega nele. Sobe pouco no começo, atravessa um platô no
 * meio e dispara no último trecho — decisão, movimento, crescimento. Depois de
 * pronta ela não congela: os pontos respiram e uma luz percorre o traço.
 *
 * Por que tudo é CSS e não JavaScript quadro a quadro: 90% dos acessos são de
 * celular. Animação declarativa roda no compositor, não na thread principal.
 * Pelo mesmo motivo os halos são gradiente radial e não `feGaussianBlur` —
 * filtro SVG animado é caro em aparelho fraco.
 */

/** Duração do ciclo inteiro, em segundos. Tudo abaixo é porcentagem dela. */
const CICLO = 16;

/** Quando a linha começa e termina de ser desenhada, em % do ciclo. */
const TRACO_INICIO = 3;
const TRACO_FIM = 28;

/** Marco convertido para porcentagem do ciclo. */
const emCiclo = (f: number) => TRACO_INICIO + f * (TRACO_FIM - TRACO_INICIO);

type Tracado = {
  largura: number;
  altura: number;
  prefixo: string;
  pontos: [number, number][];
};

/**
 * O traçado conta a história em três movimentos:
 *
 *   1) sobe — o primeiro ganho, ainda modesto
 *   2) atravessa um PLATÔ quase horizontal — o período de análise
 *   3) dispara — a decisão tomada
 *
 * O platô é o que diferencia isto de um gráfico financeiro genérico: sem ele
 * a linha vira uma diagonal uniforme e não diz nada.
 */
const DESKTOP: Tracado = {
  largura: 1600,
  altura: 900,
  prefixo: "d",
  pontos: [
    [170, 730],
    [560, 600],
    [960, 585],
    [1400, 210],
  ],
};

const CELULAR: Tracado = {
  largura: 1200,
  altura: 900,
  prefixo: "m",
  pontos: [
    [150, 785],
    [430, 645],
    [740, 630],
    [1050, 195],
  ],
};

const paraD = (t: Tracado) =>
  t.pontos.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x} ${y}`).join(" ");

/**
 * Onde cada ponto cai ao longo do traço, de 0 a 1.
 *
 * Tem que ser distância percorrida, não posição em X: o ponto precisa acender
 * no instante em que a linha chega nele, e o platô é longo em X mas curto em
 * subida. Por isso cada traçado calcula os seus — com o platô os dois deixaram
 * de bater, e reaproveitar um só conjunto atrasaria o terceiro ponto em quase
 * um quarto de segundo no celular.
 */
function marcosDe(t: Tracado): number[] {
  const acumulado: number[] = [0];
  let total = 0;
  for (let i = 1; i < t.pontos.length; i++) {
    total += Math.hypot(
      t.pontos[i][0] - t.pontos[i - 1][0],
      t.pontos[i][1] - t.pontos[i - 1][1],
    );
    acumulado.push(total);
  }
  return acumulado.map((d) => d / total);
}

/**
 * As animações precisam nascer aqui e não no globals.css porque três delas
 * mudam por ponto: cada marco tem um instante próprio dentro do mesmo ciclo.
 * Usar `animation-delay` não serviria — o atraso desloca o ciclo inteiro, e aí
 * o desaparecimento no fim sairia fora de hora em cada ponto.
 */
function cssDosPontos(t: Tracado) {
  const p = t.prefixo;
  return marcosDe(t)
    .map((f, i) => {
      const m = +emCiclo(f).toFixed(2);
      return `
/* ${t.prefixo === "d" ? "desktop" : "celular"} · ponto ${i + 1} — a linha chega nele em ${m}% do ciclo */
@keyframes b2b${p}Ponto${i} {
  0%, ${m}% { opacity: 0; }
  ${(m + 1.5).toFixed(2)}%, 86% { opacity: 1; }
  93%, 100% { opacity: 0; }
}
@keyframes b2b${p}Nucleo${i} {
  0%, ${m}% { transform: scale(0.2); }
  ${(m + 2).toFixed(2)}% { transform: scale(1.3); }
  ${(m + 5).toFixed(2)}%, 100% { transform: scale(1); }
}
@keyframes b2b${p}Halo${i} {
  0%, ${m}% { opacity: 0; transform: scale(0.35); }
  ${(m + 1).toFixed(2)}% { opacity: 0.7; }
  ${(m + 11).toFixed(2)}%, 100% { opacity: 0; transform: scale(2.6); }
}
.b2b${p}Ponto${i} { animation: b2b${p}Ponto${i} ${CICLO}s linear infinite; }
.b2b${p}Nucleo${i} { animation: b2b${p}Nucleo${i} ${CICLO}s cubic-bezier(0.16, 1, 0.3, 1) infinite; }
.b2b${p}Halo${i} { animation: b2b${p}Halo${i} ${CICLO}s ease-out infinite; }`;
    })
    .join("\n");
}

function estaticoDosPontos(t: Tracado) {
  return marcosDe(t)
    .map(
      (_, i) => `.b2b${t.prefixo}Ponto${i} { opacity: 1; }
  .b2b${t.prefixo}Nucleo${i} { transform: scale(1); }
  .b2b${t.prefixo}Halo${i} { opacity: 0; }`,
    )
    .join("\n  ");
}

function montarCss() {
  const porPonto = cssDosPontos(DESKTOP) + "\n" + cssDosPontos(CELULAR);

  return `
.b2bGrafico { display: block; width: 100%; height: 100%; }
.b2bGrafico circle,
.b2bGrafico ellipse { transform-box: fill-box; transform-origin: center; }

/* A linha sendo desenhada. O pathLength=1 normaliza o comprimento, então o
   mesmo par de valores serve para os dois traçados. */
@keyframes b2bTraco {
  0%, ${TRACO_INICIO}% { stroke-dashoffset: 1; opacity: 0; }
  ${TRACO_INICIO + 2}% { opacity: 1; }
  ${TRACO_FIM}%, 86% { stroke-dashoffset: 0; opacity: 1; }
  93%, 100% { stroke-dashoffset: 0; opacity: 0; }
}
.b2bTraco {
  stroke-dasharray: 1;
  animation: b2bTraco ${CICLO}s cubic-bezier(0.32, 0.72, 0.3, 1) infinite;
}

/* Envelope da fase viva: só existe depois que a linha ficou pronta. Tudo que
   fica "respirando" mora dentro dele, então nada aparece antes da hora nem
   sobra depois. Opacidade em SVG multiplica pelo pai — é isso que permite a
   respiração ter um laço próprio, independente do ciclo de 16s. */
@keyframes b2bViva {
  0%, 30% { opacity: 0; }
  38%, 84% { opacity: 1; }
  91%, 100% { opacity: 0; }
}
.b2bViva { animation: b2bViva ${CICLO}s ease-in-out infinite; }

/* A luz que percorre o traço. Um pedaço curto de traço correndo pelo mesmo
   caminho — mais barato que mover um objeto e sempre alinhado à curva. */
@keyframes b2bLuz {
  from { stroke-dashoffset: 1; }
  to { stroke-dashoffset: 0; }
}
.b2bLuz {
  stroke-dasharray: 0.1 0.9;
  animation: b2bLuz 5.2s linear infinite;
}

/* Respiração dos pontos. Laço curto e solto do ciclo principal, com defasagem
   por ponto para não pulsarem todos juntos. */
@keyframes b2bRespira {
  0%, 100% { opacity: 0.16; }
  50% { opacity: 0.44; }
}
.b2bRespira { animation: b2bRespira 3.8s ease-in-out infinite; }
${porPonto}

/* Sem movimento: mostra a peça pronta, parada. Sem isto o leitor com "reduzir
   movimento" ligado veria um quadro vazio, porque a regra global do projeto
   encerra as animações e elas terminam em opacidade 0. */
@media (prefers-reduced-motion: reduce) {
  .b2bGrafico * { animation: none !important; }
  .b2bTraco { stroke-dashoffset: 0; opacity: 1; }
  .b2bViva { opacity: 1; }
  .b2bLuz { opacity: 0; }
  .b2bRespira { opacity: 0.3; }
  ${estaticoDosPontos(DESKTOP)}
  ${estaticoDosPontos(CELULAR)}
}
`;
}

const CSS = montarCss();

function Grafico({ t }: { t: Tracado }) {
  const d = paraD(t);
  const p = t.prefixo;
  const idHalo = `b2bHaloGrad-${p}`;
  const idAura = `b2bAuraGrad-${p}`;
  const idLinha = `b2bLinhaGrad-${p}`;

  return (
    <svg
      className="b2bGrafico"
      viewBox={`0 0 ${t.largura} ${t.altura}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {/* O ouro do selo, correndo ao longo da linha em vez de de cima para
            baixo: a linha sobe, e o degradê acompanha a subida. */}
        <linearGradient id={idLinha} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#8a6a1c" />
          <stop offset="45%" stopColor="#d4af37" />
          <stop offset="100%" stopColor="#f6e3a1" />
        </linearGradient>
        <radialGradient id={idHalo}>
          <stop offset="0%" stopColor="#f6e3a1" stopOpacity="0.85" />
          <stop offset="55%" stopColor="#d4af37" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#d4af37" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={idAura}>
          <stop offset="0%" stopColor="#f6e3a1" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#d4af37" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Sombra da linha: um traço largo e apagado por baixo do traço real.
          É o que faz o ouro parecer aceso em vez de desenhado. */}
      <path
        className="b2bTraco"
        d={d}
        fill="none"
        stroke="#d4af37"
        strokeOpacity="0.2"
        strokeWidth="20"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
      />
      <path
        className="b2bTraco"
        d={d}
        fill="none"
        stroke={`url(#${idLinha})`}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
      />

      <g className="b2bViva">
        <path
          className="b2bLuz"
          d={d}
          fill="none"
          stroke="#fff8e0"
          strokeOpacity="0.45"
          strokeWidth="6"
          strokeLinecap="round"
          pathLength={1}
        />
      </g>

      {t.pontos.map(([x, y], i) => (
        <g key={i} className={`b2b${p}Ponto${i}`}>
          {/* pulso do momento em que a linha chega */}
          <circle
            className={`b2b${p}Halo${i}`}
            cx={x}
            cy={y}
            r={46}
            fill={`url(#${idHalo})`}
          />
          {/* respiração contínua, só na fase viva */}
          <g className="b2bViva">
            <circle
              className="b2bRespira"
              cx={x}
              cy={y}
              r={36}
              fill={`url(#${idAura})`}
              style={{ animationDelay: `${(i * 0.85).toFixed(2)}s` }}
            />
          </g>
          <circle
            className={`b2b${p}Nucleo${i}`}
            cx={x}
            cy={y}
            r={10}
            fill="#fdf3cf"
          />
          <circle
            className={`b2b${p}Nucleo${i}`}
            cx={x}
            cy={y}
            r={19}
            fill="none"
            stroke="#d4af37"
            strokeOpacity="0.55"
            strokeWidth="2"
          />
        </g>
      ))}
    </svg>
  );
}

export default function StrategyChart({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  // Parallax mínimo, e só na grade. A linha fica firme: ela é o assunto, e
  // assunto que flutua junto com o fundo perde a leitura.
  const y = useTransform(scrollYProgress, [0, 1], ["-14px", "14px"]);

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden bg-navy ${className}`}
      style={{ background: "linear-gradient(165deg, #0a1730 0%, #081227 45%, #04060e 100%)" }}
    >
      <style>{CSS}</style>

      <motion.div style={{ y }} className="absolute inset-[-3%]">
        <svg className="h-full w-full" aria-hidden="true" focusable="false">
          <defs>
            <pattern id="b2bGrade" width="64" height="64" patternUnits="userSpaceOnUse">
              <path
                d="M64 0H0v64"
                fill="none"
                stroke="#d4af37"
                strokeOpacity="0.07"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#b2bGrade)" />
        </svg>
      </motion.div>

      {/* Vinheta: apaga a grade nas bordas para ela não competir com a linha. */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 95% at 50% 50%, transparent 38%, rgba(4,6,14,0.55) 78%, rgba(4,6,14,0.9) 100%)",
        }}
      />

      <div className="absolute inset-0 hidden md:block">
        <Grafico t={DESKTOP} />
      </div>
      <div className="absolute inset-0 md:hidden">
        <Grafico t={CELULAR} />
      </div>
    </div>
  );
}
