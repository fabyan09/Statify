export class SearchTrackDto {
  _id: string;
  name: string;
  duration_ms: number;
  explicit: boolean;
  popularity: number;
  external_urls: {
    spotify: string;
  };
  artistNames: string;
  albumName: string;
  albumImage: string | null;
}

export class SearchAlbumDto {
  _id: string;
  name: string;
  album_type: string;
  images: Array<{ url: string; height: number; width: number }>;
  external_urls: {
    spotify: string;
  };
  artistNames: string;
}
