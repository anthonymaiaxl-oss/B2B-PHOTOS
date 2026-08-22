"use client";

import { useEffect, useRef } from "react";

/**
 * Fundo animado do topo da home: uma malha de nós dourados que flutua devagar
 * e se liga por fios quando dois pontos chegam perto.
 *
 * O motivo de existir é a marca — B2B CONEXÕES. O fundo é o próprio conceito
 * do evento em movimento, em vez de uma imagem ilustrativa qualquer.
 *
 * Regras que este componente respeita:
 *
 * - Nunca usa foto do Drive. É desenho, não fotografia. Não há risco de o
 *   visitante confundir o fundo com registro do dia.
 * - Para quem pediu menos movimento no sistema (prefers-reduced-motion), pinta
 *   UM quadro parado e encerra. Nenhum requestAnimationFrame roda.
 * - Congela quando a aba sai de foco ou quando o topo sai da tela. Rolar a
 *   página não deixa uma animação girando à toa atrás do conteúdo.
 *
 * A opacidade é baixa de propósito: sobre este canvas ainda vêm o gradiente
 * escuro e a vinheta do Hero. Calibrar olhando o resultado montado.
 */

type No = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  /** Fase própria para o brilho pulsar fora de sincronia entre os nós. */
  fase: number;
};

const OURO = "212,175,55";
const OURO_CLARO = "246,227,161";

export default function HeroBackdrop({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const semMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let largura = 0;
    let altura = 0;
    let nos: No[] = [];
    let quadro = 0;
    let visivel = true;
    let t = 0;

    /** Distância em que dois nós começam a se enxergar. */
    let alcance = 0;

    const semear = () => {
      // Densidade por área: telas grandes ganham mais nós, o celular não
      // carrega peso que ninguém vai ver.
      const area = largura * altura;
      const quantos = Math.max(14, Math.min(52, Math.round(area / 30000)));
      alcance = Math.min(260, Math.max(120, Math.sqrt(area) / 4.6));

      nos = Array.from({ length: quantos }, () => ({
        x: Math.random() * largura,
        y: Math.random() * altura,
        // Lento de propósito: o fundo é ambiente, não é o assunto.
        vx: (Math.random() - 0.5) * 0.16,
        vy: (Math.random() - 0.5) * 0.16,
        r: 0.9 + Math.random() * 1.5,
        fase: Math.random() * Math.PI * 2,
      }));
    };

    const medir = () => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return false;
      // Teto de 2 no DPR: acima disso o custo sobe e ninguém vê diferença
      // num fundo desfocado atrás de duas camadas escuras.
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      largura = rect.width;
      altura = rect.height;
      canvas.width = Math.round(largura * dpr);
      canvas.height = Math.round(altura * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return true;
    };

    const pintar = () => {
      ctx.clearRect(0, 0, largura, altura);

      // Os fios primeiro, para que os pontos fiquem por cima das junções.
      for (let i = 0; i < nos.length; i++) {
        for (let j = i + 1; j < nos.length; j++) {
          const a = nos[i];
          const b = nos[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist > alcance) continue;
          // Quanto mais perto, mais firme o fio. É o que dá a sensação de
          // ligação se formando e se desfazendo sozinha.
          const forca = 1 - dist / alcance;
          ctx.strokeStyle = `rgba(${OURO},${(forca * 0.3).toFixed(3)})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      for (const no of nos) {
        const pulso = 0.62 + 0.38 * Math.sin(t * 0.02 + no.fase);

        const halo = ctx.createRadialGradient(no.x, no.y, 0, no.x, no.y, no.r * 7);
        halo.addColorStop(0, `rgba(${OURO},${(0.3 * pulso).toFixed(3)})`);
        halo.addColorStop(1, `rgba(${OURO},0)`);
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(no.x, no.y, no.r * 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(${OURO_CLARO},${(0.72 * pulso).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(no.x, no.y, no.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const passo = () => {
      t += 1;
      for (const no of nos) {
        no.x += no.vx;
        no.y += no.vy;
        // Atravessa a borda e volta pelo outro lado. Sem quicar: bater na
        // parede cria um padrão que o olho percebe e cansa.
        const folga = alcance * 0.5;
        if (no.x < -folga) no.x = largura + folga;
        if (no.x > largura + folga) no.x = -folga;
        if (no.y < -folga) no.y = altura + folga;
        if (no.y > altura + folga) no.y = -folga;
      }
      pintar();
      quadro = requestAnimationFrame(passo);
    };

    const parar = () => {
      if (quadro) cancelAnimationFrame(quadro);
      quadro = 0;
    };

    const tocar = () => {
      if (semMovimento || quadro || !visivel || document.hidden) return;
      quadro = requestAnimationFrame(passo);
    };

    if (!medir()) return;
    semear();
    pintar();

    if (semMovimento) return;

    const aoRedimensionar = new ResizeObserver(() => {
      if (!medir()) return;
      semear();
      pintar();
    });
    aoRedimensionar.observe(canvas);

    // Fora da tela, nada roda.
    const aoEntrar = new IntersectionObserver(
      ([entrada]) => {
        visivel = entrada.isIntersecting;
        if (visivel) tocar();
        else parar();
      },
      { threshold: 0 },
    );
    aoEntrar.observe(canvas);

    const aoTrocarAba = () => (document.hidden ? parar() : tocar());
    document.addEventListener("visibilitychange", aoTrocarAba);

    tocar();

    return () => {
      parar();
      aoRedimensionar.disconnect();
      aoEntrar.disconnect();
      document.removeEventListener("visibilitychange", aoTrocarAba);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className={className} />;
}
