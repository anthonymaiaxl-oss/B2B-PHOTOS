import { eventConfig } from "@/config/event";

/**
 * Selo circular do evento — a mesma ideia da arte oficial, desenhada em SVG
 * para ficar nítida em qualquer tela e não pesar no carregamento.
 *
 * Para usar a arte original: coloque o PNG em `public/selo.png` e ajuste
 * `sealImage` em `src/config/event.ts`.
 *
 * ---------------------------------------------------------------------------
 * GEOMETRIA — por que os números são estes
 *
 * A faixa de texto circular corre num raio de 122. Com o corpo da fonte, ela
 * ocupa de fato a coroa entre os raios ~113 e ~124. Ou seja: TODO o conteúdo
 * central precisa caber num círculo de raio 110, e não nos 156 da borda.
 *
 * Isso é o que dava errado antes. "PREPARE-SE PARA O NOVO CENÁRIO" ficava em
 * y=292 — em cima da faixa e larga demais para o vão — e por isso aparecia
 * cortada. Trocar a frase pelo ano não resolveria: qualquer coisa entre
 * y≈270 e y≈292 esbarra na faixa do mesmo jeito. Não existe "rodapé" dentro
 * deste selo, então a área abaixo de TRIBUTÁRIA simplesmente ficou vazia e o
 * conjunto foi recentrado.
 *
 * Regra para mexer aqui: um texto de largura L numa altura y só cabe se
 *     L / 2  ≤  √(110² − (y − 160)²)
 * ---------------------------------------------------------------------------
 */
export default function EventSeal({ className = "" }: { className?: string }) {
  if (eventConfig.sealImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={eventConfig.sealImage}
        alt={`Selo do ${eventConfig.name}`}
        className={`select-none ${className}`}
        draggable={false}
      />
    );
  }

  return (
    <svg
      viewBox="0 0 320 320"
      role="img"
      aria-label={`Selo do ${eventConfig.name}`}
      className={`select-none ${className}`}
    >
      <defs>
        <linearGradient id="seal-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fdf3cf" />
          <stop offset="26%" stopColor="#f6e3a1" />
          <stop offset="60%" stopColor="#d4af37" />
          <stop offset="100%" stopColor="#8a6a1c" />
        </linearGradient>

        {/*
          Mesmo degradê, mas em coordenadas absolutas.

          É obrigatório para os traços da balança: um degradê em
          `objectBoundingBox` (o padrão) não tem como ser calculado quando a
          caixa do elemento tem largura ou altura zero — e uma linha reta tem.
          O resultado era o traço sumir: o selo mostrava dois triângulos
          soltos, sem a haste nem os braços da balança.
        */}
        <linearGradient id="seal-gold-abs" gradientUnits="userSpaceOnUse" x1="0" y1="60" x2="0" y2="250">
          <stop offset="0%" stopColor="#fdf3cf" />
          <stop offset="26%" stopColor="#f6e3a1" />
          <stop offset="60%" stopColor="#d4af37" />
          <stop offset="100%" stopColor="#8a6a1c" />
        </linearGradient>

        <radialGradient id="seal-bg" cx="50%" cy="34%" r="72%">
          <stop offset="0%" stopColor="#12244d" />
          <stop offset="62%" stopColor="#0a1329" />
          <stop offset="100%" stopColor="#050a17" />
        </radialGradient>
        <path
          id="seal-arc"
          d="M 160 160 m -122 0 a 122 122 0 1 1 244 0 a 122 122 0 1 1 -244 0"
          fill="none"
        />
      </defs>

      <circle cx="160" cy="160" r="158" fill="url(#seal-bg)" />
      <circle cx="160" cy="160" r="156" fill="none" stroke="url(#seal-gold-abs)" strokeWidth="2.5" />
      <circle
        cx="160"
        cy="160"
        r="146"
        fill="none"
        stroke="url(#seal-gold-abs)"
        strokeWidth="0.8"
        opacity="0.6"
      />

      {/* Faixa de texto circular, girando devagar.
          `textLength` + `lengthAdjust="spacing"` obrigam o texto a ocupar
          exatamente a circunferência (2·π·122 ≈ 766). Sem isso o espaçamento
          fixo somava mais de 1000px e as duas voltas se sobrepunham. */}
      <g className="animate-spin-slow" style={{ transformOrigin: "160px 160px" }}>
        <text
          fill="#d4af37"
          fontSize="9.5"
          fontFamily="var(--font-mono), monospace"
          opacity="0.8"
        >
          <textPath href="#seal-arc" startOffset="0%" textLength="758" lengthAdjust="spacing">
            CONHECIMENTO · NETWORKING · ESTRATÉGIA · CONHECIMENTO · NETWORKING · ESTRATÉGIA ·
          </textPath>
        </text>
      </g>

      {/* Balança: haste, braços e base. */}
      <g stroke="url(#seal-gold-abs)" fill="none" strokeWidth="2.2" strokeLinecap="round">
        <path d="M160 66 v30" />
        <path d="M134 78 h52" />
        <path d="M148 100 h24" />
      </g>
      <g fill="url(#seal-gold-abs)">
        <path d="M134 78 l-10 20 h20 z" />
        <path d="M186 78 l-10 20 h20 z" />
      </g>

      <text
        x="160"
        y="126"
        dx="-2.75"
        textAnchor="middle"
        fill="#ffffff"
        fontSize="14"
        letterSpacing="5.5"
        fontWeight="600"
        fontFamily="var(--font-display), sans-serif"
      >
        MASTER CLASS
      </text>

      {/* Barras de crescimento. */}
      <g fill="url(#seal-gold-abs)">
        <rect x="128" y="172" width="9" height="14" rx="1.5" />
        <rect x="141" y="166" width="9" height="20" rx="1.5" />
        <rect x="154" y="158" width="9" height="28" rx="1.5" />
        <rect x="167" y="148" width="9" height="38" rx="1.5" />
        <rect x="180" y="138" width="9" height="48" rx="1.5" />
      </g>

      <text
        x="160"
        y="214"
        textAnchor="middle"
        fill="url(#seal-gold-abs)"
        fontSize="18.5"
        fontWeight="800"
        letterSpacing="0.5"
        fontFamily="var(--font-display), sans-serif"
      >
        REFORMA
      </text>
      <text
        x="160"
        y="237"
        textAnchor="middle"
        fill="url(#seal-gold-abs)"
        fontSize="18.5"
        fontWeight="800"
        letterSpacing="0.5"
        fontFamily="var(--font-display), sans-serif"
      >
        TRIBUTÁRIA
      </text>
    </svg>
  );
}
