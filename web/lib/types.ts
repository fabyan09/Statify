export interface ExternalUrls {
  spotify: string;
}

export interface Image {
  url: string;
  height: number;
  width: number;
}

export interface Artist {
  _id: string;
  name: string;
  popularity: number;
  followers: number;
  genres: string[];
  href: string;
  uri: string;
  external_urls: ExternalUrls;
  images: Image[];
}

export interface Album {
  _id: string;
  name: string;
  album_type: string;
  total_tracks: number;
  release_date: string;
  release_date_precision: string;
  popularity: number;
  href: string;
  uri: string;
  external_urls: ExternalUrls;
  images: Image[];
  label: string;
  artist_ids: string[];
  track_ids: string[];
  genres: string[];
  spotify_synced: boolean;
}

export interface Track {
  _id: string;
  name: string;
  popularity: number;
  duration_ms: number;
  explicit: boolean;
  preview_url: string;
  track_number: number;
  disc_number: number;
  href: string;
  uri: string;
  external_urls: ExternalUrls;
  album_id: string;
  artist_ids: string[];
  added_at: string;
  added_by: string;
  playlist_id: string;
  playlist_name: string;
}
