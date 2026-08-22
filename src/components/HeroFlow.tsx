"use client";

import { useEffect, useRef } from "react";

/**
 * O fundo líquido do topo: massas escuras que se dobram devagar, com veios de
 * ouro só nas cristas.
 *
 * A referência é um gradiente líquido roxo e branco, bem alto. Aqui ele foi
 * puxado para o oposto: fica escuro quase o tempo todo e o ouro aparece
 * apenas onde a "onda" chega ao alto — como luz atravessando água. O motivo é
 * que atrás disto vem o selo, o título e a chamada; um fundo colorido de
 * ponta a ponta brigaria com eles, e a página é sobre encontrar uma foto, não
 * sobre o fundo.
 *
 * POR QUE WEBGL E NÃO CSS
 * O efeito é ruído deformado por ruído (domain warping). Em CSS isso só se
 * imita empilhando degradês borrados, e `filter: blur` em tela cheia é das
 * coisas mais caras que existem no celular. No shader o mesmo desenho é uma
 * conta por pixel, feita na GPU, sem tocar na thread principal.
 *
 * O ORÇAMENTO — e ele é o ponto, porque 90% dos acessos são de celular:
 *
 *   1) Resolução pela metade. O desenho é todo borrado; ninguém enxerga a
 *      diferença, e o custo cai a um quarto.
 *   2) 30 quadros por segundo. A massa leva ~20s para dar uma volta; a 60fps
 *      o movimento seria idêntico e custaria o dobro.
 *   3) Congela fora da tela e com a aba em segundo plano. Rolar até os álbuns
 *      não deixa a GPU trabalhando atrás do conteúdo.
 *   4) `prefers-reduced-motion` desenha UM quadro e para. Nenhum laço roda.
 *
 * Se o navegador não der contexto WebGL, o componente simplesmente não pinta
 * nada — o Hero já tem o próprio fundo escuro embaixo.
 */

const VERTEX = `
attribute vec2 pos;
void main() { gl_Position = vec4(pos, 0.0, 1.0); }
`;

const FRAGMENT = `
precision mediump float;
uniform vec2 u_res;
uniform float u_t;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

// Quatro oitavas bastam: o resultado passa por dobra dupla e o detalhe fino
// se perde de qualquer jeito. Seis só gastariam GPU.
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p *= 2.02;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = vec2(uv.x * (u_res.x / u_res.y), uv.y) * 1.5;
  float t = u_t * 0.05;

  // Dobra dupla: é o que transforma manchas de ruído em massa líquida.
  vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3 - t)));
  vec2 r = vec2(
    fbm(p + 3.4 * q + vec2(1.7, 9.2) + t * 0.7),
    fbm(p + 3.4 * q + vec2(8.3, 2.8) - t * 0.5)
  );
  float f = fbm(p + 3.4 * r);

  // Ruído de ruído concentra os valores em torno de 0.5 — a distribuição é
  // estreita, e uma faixa de cor colocada em 0.75 simplesmente nunca era
  // alcançada: o fundo saía inteiro azul, sem um fio de ouro. Este remapeia
  // a faixa útil para 0..1 antes de colorir.
  f = smoothstep(0.30, 0.74, f);

  vec3 breu     = vec3(0.016, 0.024, 0.055);
  vec3 marinho  = vec3(0.031, 0.071, 0.153);
  vec3 azulAlto = vec3(0.086, 0.176, 0.353);
  vec3 ouro     = vec3(0.831, 0.686, 0.216);
  vec3 ouroClaro= vec3(0.965, 0.890, 0.631);

  vec3 cor = mix(breu, marinho, smoothstep(0.05, 0.40, f));
  cor = mix(cor, azulAlto, smoothstep(0.45, 0.88, f));

  // O ouro é uma FAIXA estreita, não um degradê até o topo: passada a crista
  // a onda volta ao azul. É isso que faz parecer veio de metal correndo na
  // massa, e não um céu alaranjado.
  float veio = smoothstep(0.58, 0.72, f) * (1.0 - smoothstep(0.72, 0.88, f));
  cor = mix(cor, ouro, veio * 0.5);

  // O realce final é MUITO discreto. Numa primeira tentativa ele valia 0.3 e
  // as áreas altas viravam um platô cinza-azulado: o efeito lia como mármore,
  // não como massa escura com veio de metal.
  cor += ouroClaro * smoothstep(0.94, 1.0, f) * 0.1;

  // Vinheta: empurra o olho para o centro, onde fica o selo.
  float d = distance(uv, vec2(0.5, 0.44));
  cor *= 1.0 - smoothstep(0.34, 0.95, d) * 0.8;

  gl_FragColor = vec4(cor, 1.0);
}
`;

/** Metade da resolução: o desenho é borrado, o custo cai a um quarto. */
const ESCALA = 0.5;

/** 30 quadros por segundo. A massa leva ~20s para dar a volta. */
const INTERVALO = 1000 / 30;

function compilar(gl: WebGLRenderingContext, tipo: number, fonte: string) {
  const s = gl.createShader(tipo);
  if (!s) return null;
  gl.shaderSource(s, fonte);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    gl.deleteShader(s);
    return null;
  }
  return s;
}

export default function HeroFlow({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "low-power",
    });
    // Sem WebGL não pinta nada: o Hero já tem fundo escuro embaixo.
    if (!gl) return;

    const vs = compilar(gl, gl.VERTEX_SHADER, VERTEX);
    const fs = compilar(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    if (!vs || !fs) return;

    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    // Um triângulo que cobre a tela inteira — mais barato que dois.
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const attr = gl.getAttribLocation(prog, "pos");
    gl.enableVertexAttribArray(attr);
    gl.vertexAttribPointer(attr, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "u_res");
    const uT = gl.getUniformLocation(prog, "u_t");

    const semMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let largura = 0;
    let altura = 0;

    const medir = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const l = Math.max(1, Math.round(canvas.clientWidth * dpr * ESCALA));
      const a = Math.max(1, Math.round(canvas.clientHeight * dpr * ESCALA));
      if (l === largura && a === altura) return;
      largura = l;
      altura = a;
      canvas.width = l;
      canvas.height = a;
      gl.viewport(0, 0, l, a);
      gl.uniform2f(uRes, l, a);
    };

    const pintar = (t: number) => {
      gl.uniform1f(uT, t);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    medir();

    if (semMovimento) {
      pintar(12);
      return;
    }

    let rodando = false;
    let visivel = false;
    let quadro = 0;
    let ultimo = 0;
    const inicio = performance.now();

    const laco = (agora: number) => {
      quadro = requestAnimationFrame(laco);
      if (agora - ultimo < INTERVALO) return;
      ultimo = agora;
      medir();
      pintar((agora - inicio) / 1000);
    };

    const avaliar = () => {
      const deveRodar = visivel && !document.hidden;
      if (deveRodar === rodando) return;
      rodando = deveRodar;
      if (rodando) quadro = requestAnimationFrame(laco);
      else cancelAnimationFrame(quadro);
    };

    const observador = new IntersectionObserver(
      ([entrada]) => {
        visivel = entrada.isIntersecting;
        avaliar();
      },
      { threshold: 0 },
    );
    observador.observe(canvas);

    document.addEventListener("visibilitychange", avaliar);
    const aoRedimensionar = () => medir();
    window.addEventListener("resize", aoRedimensionar);

    return () => {
      cancelAnimationFrame(quadro);
      observador.disconnect();
      document.removeEventListener("visibilitychange", avaliar);
      window.removeEventListener("resize", aoRedimensionar);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className={className} />;
}
