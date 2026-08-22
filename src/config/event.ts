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
      // "Boa parte do valor do dia aconteceu no intervalo do café" saiu: dava a
      // entender que o conteúdo valia menos que a pausa. O encontro é o ponto
      // do capítulo, sem precisar diminuir o resto do evento.
      text: "Contador, empresário e consultor na mesma sala. O tipo de encontro que não se marca por e-mail.",
    },
    {
      num: "03",
      word: "ESTRATÉGIA",
      text: "O que muda no seu regime, no seu preço e no seu contrato — e o que dá para decidir agora, antes da transição.",
    },
    {
      num: "04",
      word: "MOMENTOS",
      // "Está tudo aqui" saiu: prometia que este bloco era onde se pega as
      // fotos. Ele é capítulo editorial, não link — quem clica aqui não vai
      // para lugar nenhum. Os álbuns ficam na seção EXPLORE O DIA INTEIRO.
      text: "As perguntas difíceis, o riso no intervalo, o aperto de mão no fim da tarde. O dia também foi isso.",
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
   * IMAGENS DAS SEÇÕES — hero, os quatro capítulos e o bloco final.
   *
   * Cada campo aceita três formas:
   *
   * 1) NOME DE UMA FOTO DO ÁLBUM  →  "IMG_1024.jpg"
   *    Aponta uma foto real que já está no Drive. É a melhor opção: a imagem
   *    sai em alta resolução, continua aparecendo na galeria e não duplica
   *    arquivo nenhum no repositório. O nome é o mesmo que aparece na área da
   *    organização; pode escrever com ou sem extensão, maiúscula não importa.
   *
   * 2) ARQUIVO FIXO EM public/    →  "/secoes/hero.jpg"
   *    Para imagem de layout que não é foto do evento. Coloque o arquivo em
   *    public/secoes/ (o "public/" não entra no caminho). 1920×1080, JPG 80.
   *
   * 3) VAZIO ("")                 →  automático
   *    O site escolhe uma foto do álbum sozinho. É o padrão.
   *
   * Se o nome apontado não existir mais (foto apagada do álbum), a seção volta
   * sozinha para o automático em vez de ficar sem imagem.
   */
  sectionImages: {
    // Fundos gráficos que vêm junto com o projeto, em public/secoes/.
    // São composições abstratas (feixes de luz, arcos, malha de conexões,
    // curva ascendente, luzes fora de foco) — NÃO são fotos do evento.
    // Servem enquanto as fotos reais não estão escolhidas: troque qualquer
    // um destes pelo nome de uma foto do álbum, ex. hero: "IMG_1024.jpg".
    // VAZIO no topo = malha animada de conexões (HeroBackdrop). O topo NÃO
    // aceita nome de foto do álbum: só caminho de public/, ex. "/secoes/x.jpg".
    hero: "",
    // ordem: 01 CONHECIMENTO, 02 NETWORKING, 03 ESTRATÉGIA, 04 MOMENTOS
    story: [
      "/secoes/conhecimento.jpg",
      "/secoes/networking.jpg",
      "/secoes/estrategia.jpg",
      "/secoes/momentos.jpg",
    ],
    cta: "/secoes/cta.jpg",
  },

  finalCta: {
    lineOne: "OS MOMENTOS PASSAM.",
    lineTwo: "AS CONEXÕES FICAM.",
    button: "VER AS FOTOS",
  },

  /**
   * A sequência da abertura, na ordem em que as palavras aparecem.
   *
   * A ÚLTIMA fecha a apresentação e é a única que sai em ouro — as outras são
   * o caminho até ela. Mexer na ordem muda o ritmo; a última deve ser sempre
   * o nome do evento.
   */
  intro: ["REFORMA TRIBUTÁRIA", "CONHECIMENTO", "NETWORKING", "ESTRATÉGIA", "MASTER CLASS"],

  /** Quem organizou o evento. Aparece na faixa entre o topo e os capítulos. */
  organizer: {
    prefix: "Organizado por",
    name: "Dra. Corlleón",
    role: "Inteligência contábil e tributária",
    url: "https://www.instagram.com/corlleon_dra",
  },

  credit: {
    prefix: "Uma experiência digital desenvolvida pela",
    name: "Simbionte",
    url: "https://www.instagram.com/simbionte.ai_/",
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
