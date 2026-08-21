import type { EventConfig } from "@/types";

/**
 * Único arquivo de conteúdo do site.
 *
 * Os álbuns NÃO ficam aqui: cada subpasta de GOOGLE_DRIVE_ROOT_FOLDER_ID
 * vira um álbum automaticamente. Criou a pasta no /admin (ou no Drive),
 * o álbum aparece no site — sem mexer em código, sem redeploy.
 */
export const eventConfig: EventConfig = {
  brand: "B2B Conexões",
  name: "Master Class Reforma Tributária",
  edition: "2026",
  // Deixe vazio para o site simplesmente não mostrar a informação.
  date: "",
  location: "",
  description:
    "As fotos oficiais da Master Class Reforma Tributária. Encontre a sua e baixe em alta.",

  hero: {
    kicker: "CONHECIMENTO · NETWORKING · ESTRATÉGIA",
    titleTop: "MASTER CLASS",
    titleMain: "REFORMA TRIBUTÁRIA",
    headline: "Prepare-se para o novo cenário.",
    subheadline:
      "O registro completo do dia: as palestras, as conversas de corredor e as conexões que saíram daqui.",
    cta: "VER AS FOTOS",
  },

  // Coloque a arte do selo em public/selo.png e troque para "/selo.png".
  sealImage: "",

  partners: [
    { name: "acenm·cdl" },
    { name: "Ecofiscal", tagline: "Ecossistema de Inteligência Empresarial" },
    { name: "B2B Conexões" },
    { name: "Corlleón", tagline: "Inteligência Contábil e Tributária" },
  ],

  story: [
    {
      num: "01",
      word: "CONHECIMENTO",
      text: "A reforma explicada por quem vive o dia a dia da apuração — sem juridiquês, com o impacto real no caixa.",
    },
    {
      num: "02",
      word: "NETWORKING",
      text: "Contador, empresário e consultor na mesma sala. Boa parte do valor do dia aconteceu no intervalo do café.",
    },
    {
      num: "03",
      word: "ESTRATÉGIA",
      text: "O que muda no seu regime, no seu preço e no seu contrato — e o que dá para decidir agora, antes da transição.",
    },
    {
      num: "04",
      word: "MOMENTOS",
      text: "As perguntas difíceis, os aplausos, o aperto de mão no fim da tarde. Está tudo aqui.",
    },
  ],

  albumCaptions: {
    palestras: "Palco principal",
    networking: "Intervalos e café",
    participantes: "Retratos",
    credenciamento: "Chegada e recepção",
    bastidores: "Backstage",
    encerramento: "Certificados e brinde",
  },

  // Usados só enquanto o Drive não está conectado (modo demonstração).
  demoAlbums: [
    { id: "palestras", name: "Palestras", caption: "Palco principal", folderId: "" },
    { id: "networking", name: "Networking", caption: "Intervalos e café", folderId: "" },
    { id: "participantes", name: "Participantes", caption: "Retratos", folderId: "" },
    { id: "credenciamento", name: "Credenciamento", caption: "Chegada e recepção", folderId: "" },
    { id: "encerramento", name: "Encerramento", caption: "Certificados e brinde", folderId: "" },
  ],

  /**
   * IMAGENS FIXAS DAS SEÇÕES
   *
   * Coloque os arquivos em `public/secoes/` e escreva o caminho aqui começando
   * com "/" (o `public/` não entra no caminho). Exemplo:
   *
   *     hero: "/secoes/hero.jpg",
   *
   * Campo vazio ("") = a seção volta ao comportamento dinâmico e usa uma foto
   * real do álbum no Drive. É de propósito: assim que as fotos verdadeiras do
   * evento estiverem no ar, basta apagar o caminho para o site passar a mostrar
   * o registro real em vez de uma imagem ilustrativa.
   *
   * Tamanho recomendado: 1920×1080 (16:9), JPG de qualidade 80, até ~350 KB.
   * Imagens muito maiores só deixam o site lento — elas ficam atrás de uma
   * camada escura e de tipografia grande.
   */
  sectionImages: {
    hero: "",
    // ordem: 01 CONHECIMENTO, 02 NETWORKING, 03 ESTRATÉGIA, 04 MOMENTOS
    story: ["", "", "", ""],
    cta: "",
  },

  finalCta: {
    lineOne: "OS MOMENTOS PASSAM.",
    lineTwo: "AS CONEXÕES FICAM.",
    button: "VER AS FOTOS",
  },

  credit: {
    prefix: "Uma experiência digital desenvolvida pela",
    name: "Simbionte",
    // TODO: coloque aqui o link da Simbionte (site ou Instagram).
    // Enquanto estiver vazio, o nome aparece em destaque mas sem link —
    // nunca aponta para um endereço inventado.
    url: "",
  },
};

/** Fotos carregadas por vez na página de álbum. */
export const PHOTOS_PER_PAGE = 24;

/** Teto de fotos por ZIP — acima disso o navegador começa a sofrer. */
export const MAX_ZIP_PHOTOS = 60;

/** Largura máxima (px) da foto otimizada no envio. */
export const UPLOAD_MAX_EDGE = 2560;
export const UPLOAD_QUALITY = 0.88;

// Usado pelo fetch do Drive em src/lib/drive.ts.
// ATENÇÃO: as rotas (src/app/page.tsx e src/app/album/[slug]/page.tsx) NÃO podem
// importar esta constante — o Next exige literal no export `revalidate`. Se mudar
// este valor, mude o 600 nos dois arquivos também.
export const REVALIDATE_SECONDS = 600;
