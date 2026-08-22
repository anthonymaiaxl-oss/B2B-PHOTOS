export interface Photo {
  id: string;
  name: string;
  /** Miniatura usada na grade (servida por /api/photo). */
  thumbnailUrl: string;
  /** Versão grande usada no lightbox. */
  previewUrl: string;
  /** Download com Content-Disposition: attachment (/api/download). */
  downloadUrl: string;
  width?: number;
  height?: number;
  size?: number;
  createdTime?: string;
}

export interface Album {
  /** Slug usado na URL. Derivado do nome da pasta no Drive. */
  id: string;
  name: string;
  caption: string;
  folderId: string;
}

export interface AlbumWithPhotos extends Album {
  photos: Photo[];
  cover: Photo | null;
}

export interface Stat {
  value: number;
  prefix?: string;
  label: string;
}

export interface StoryChapter {
  num: string;
  word: string;
  text: string;
}

export interface Partner {
  name: string;
  tagline?: string;
}

export interface EventConfig {
  /** Marca do site (aparece no header/rodapé). */
  brand: string;
  /** Evento que este álbum cobre. */
  name: string;
  edition: string;
  date: string;
  location: string;
  description: string;
  hero: {
    kicker: string;
    titleTop: string;
    titleMain: string;
    headline: string;
    subheadline: string;
    cta: string;
  };
  /** Caminho de uma arte redonda em public/ (ex.: "/selo.png"). Vazio = selo desenhado em SVG. */
  sealImage: string;
  partners: Partner[];
  story: StoryChapter[];
  /** Legenda opcional por slug de álbum. Sem entrada, o site usa o padrão. */
  albumCaptions: Record<string, string>;
  /** Álbuns exibidos quando o Drive ainda não está conectado (modo demonstração). */
  demoAlbums: Album[];
  /**
   * Imagens fixas das seções, servidas de `public/`.
   * Campo vazio = a seção volta a usar uma foto real do Drive.
   */
  sectionImages: {
    hero: string;
    /** Uma por capítulo, na ordem 01, 02, 03, 04. */
    story: string[];
    cta: string;
  };
  /** Bloco de fechamento da home. */
  finalCta: {
    lineOne: string;
    lineTwo: string;
    button: string;
  };
  /** Palavras da abertura, em ordem. A última sai em ouro. */
  intro: string[];
  /** Quem organizou. `url` vazio = nome sem link. */
  organizer: {
    prefix: string;
    name: string;
    role: string;
    url: string;
  };
  /** Assinatura discreta do rodapé. `url` vazio = texto sem link. */
  credit: {
    prefix: string;
    name: string;
    url: string;
  };
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime?: string;
  imageMediaMetadata?: { width?: number; height?: number; rotation?: number };
}

export interface StorageQuota {
  limit: number | null;
  usage: number;
  usageInDrive: number;
}
