export interface Photo {
  id: string;
  name: string;
  thumbnailUrl: string;
  previewUrl: string;
  downloadUrl: string;
  width?: number;
  height?: number;
}

export interface Album {
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

export interface EventConfig {
  name: string;
  edition: string;
  date: string;
  location: string;
  description: string;
  hero: {
    kicker: string;
    headline: string;
    subheadline: string;
    cta: string;
  };
  stats: Stat[];
  story: StoryChapter[];
  albums: Album[];
  credit: string;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  imageMediaMetadata?: { width?: number; height?: number };
}
