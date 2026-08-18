import type { EventConfig } from "@/types";

/**
 * Único arquivo que o administrador precisa editar.
 * Os folderIds vêm da URL de cada pasta no Google Drive:
 * https://drive.google.com/drive/folders/  <-- ISTO É O ID -->
 */
export const eventConfig: EventConfig = {
  name: "Conexões B2B",
  edition: "2026",
  date: "12 de março de 2026",
  location: "São Paulo · SP",
  description: "Reviva os melhores momentos do Conexões B2B.",

  hero: {
    kicker: "SÃO PAULO · 2026 · DIGITAL EXPERIENCE",
    headline: "Os momentos que conectaram negócios.",
    subheadline:
      "Reviva as conexões, encontros e ideias que fizeram parte do Conexões B2B.",
    cta: "EXPLORAR FOTOS",
  },

  stats: [
    { value: 520, prefix: "+", label: "FOTOS" },
    { value: 140, prefix: "+", label: "CONEXÕES" },
    { value: 1, prefix: "0", label: "EVENTO" },
  ],

  story: [
    {
      num: "01",
      word: "CONEXÕES",
      text: "Apertos de mão que viraram parcerias. O evento começa antes da primeira palestra.",
    },
    {
      num: "02",
      word: "IDEIAS",
      text: "Painéis, provocações e insights que mudaram a forma de olhar o próprio negócio.",
    },
    {
      num: "03",
      word: "NEGÓCIOS",
      text: "Rodadas de negociação, propostas trocadas, decisões tomadas no corredor.",
    },
    {
      num: "04",
      word: "MOMENTOS",
      text: "O que ficou: risadas, aplausos, o brinde no fim da noite.",
    },
  ],

  albums: [
    { id: "palestras", name: "Palestras", caption: "Palco principal", folderId: "" },
    { id: "networking", name: "Networking", caption: "Lounge e café", folderId: "" },
    { id: "participantes", name: "Participantes", caption: "Retratos", folderId: "" },
    { id: "especiais", name: "Momentos Especiais", caption: "Premiação", folderId: "" },
    { id: "bastidores", name: "Bastidores", caption: "Backstage", folderId: "" },
  ],

  credit: "Digital Experience by Gabriel Maia",
};

export const PHOTOS_PER_PAGE = 24;
// Usado pelo fetch do Drive em src/lib/google-drive.ts.
// ATENÇÃO: as rotas (src/app/page.tsx e src/app/album/[slug]/page.tsx) NÃO podem
// importar esta constante — o Next exige literal no export `revalidate`. Se mudar
// este valor, mude o 600 nos dois arquivos também.
export const REVALIDATE_SECONDS = 600;
