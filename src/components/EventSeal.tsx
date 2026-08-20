import { eventConfig } from "@/config/event";

/**
 * Selo circular do evento — a mesma ideia da arte oficial, desenhada em SVG
 * para ficar nítida em qualquer tela e não pesar no carregamento.
 *
 * Para usar a arte original: coloque o PNG em `public/selo.png` e ajuste
 * `sealImage` em `src/config/event.ts`.
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
      <circle cx="160" cy="160" r="156" fill="none" stroke="url(#seal-gold)" strokeWidth="2.5" />
      <circle
        cx="160"
        cy="160"
        r="146"
        fill="none"
        stroke="url(#seal-gold)"
        strokeWidth="0.8"
        opacity="0.6"
      />

      {/* Faixa de texto circular, girando devagar */}
      <g className="animate-spin-slow" style={{ transformOrigin: "160px 160px" }}>
        <text
          fill="#d4af37"
          fontSize="11.5"
          letterSpacing="5.6"
          fontFamily="var(--font-mono), monospace"
          opacity="0.85"
        >
          <textPath href="#seal-arc" startOffset="2%">
            CONHECIMENTO · NETWORKING · ESTRATÉGIA · CONHECIMENTO · NETWORKING · ESTRATÉGIA ·
          </textPath>
        </text>
      </g>

      {/* Balança + linha de crescimento: o par que abre a arte oficial */}
      <g stroke="url(#seal-gold)" fill="none" strokeWidth="2.2" strokeLinecap="round">
        <path d="M160 78 v34" />
        <path d="M132 92 h56" />
        <path d="M132 92 l-11 22 h22 z" fill="url(#seal-gold)" stroke="none" />
        <path d="M188 92 l-11 22 h22 z" fill="url(#seal-gold)" stroke="none" />
        <path d="M146 116 h28" />
      </g>

      <g fill="url(#seal-gold)">
        <rect x="128" y="196" width="9" height="16" rx="1.5" />
        <rect x="141" y="188" width="9" height="24" rx="1.5" />
        <rect x="154" y="178" width="9" height="34" rx="1.5" />
        <rect x="167" y="166" width="9" height="46" rx="1.5" />
        <rect x="180" y="152" width="9" height="60" rx="1.5" />
      </g>

      <text
        x="160"
        y="140"
        textAnchor="middle"
        fill="#ffffff"
        fontSize="15"
        letterSpacing="7"
        fontWeight="600"
        fontFamily="var(--font-display), sans-serif"
      >
        MASTER CLASS
      </text>

      <text
        x="160"
        y="238"
        textAnchor="middle"
        fill="url(#seal-gold)"
        fontSize="21"
        fontWeight="800"
        letterSpacing="0.5"
        fontFamily="var(--font-display), sans-serif"
      >
        REFORMA
      </text>
      <text
        x="160"
        y="262"
        textAnchor="middle"
        fill="url(#seal-gold)"
        fontSize="21"
        fontWeight="800"
        letterSpacing="0.5"
        fontFamily="var(--font-display), sans-serif"
      >
        TRIBUTÁRIA
      </text>

      <line x1="96" y1="276" x2="224" y2="276" stroke="url(#seal-gold)" strokeWidth="0.9" opacity="0.7" />
      <text
        x="160"
        y="292"
        textAnchor="middle"
        fill="#d4af37"
        fontSize="8.4"
        letterSpacing="3"
        fontFamily="var(--font-mono), monospace"
        opacity="0.9"
      >
        PREPARE-SE PARA O NOVO CENÁRIO
      </text>
    </svg>
  );
}
