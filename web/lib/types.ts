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
  album_ids?: string[];
  spotify_synced?: boolean;
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
  album_id: string | Album; // Can be populated with full Album object
  artist_ids: string[];
  added_at: string;
  added_by: string;
  playlist_id: string;
  playlist_name: string;
}

// Extended types for search results with enriched data
export interface SearchTrack extends Track {
  albumImage?: string;
  albumName?: string;
  artistNames?: string;
}

export interface SearchAlbum extends Album {
  artistNames?: string;
}

// SearchArtist is the same as Artist
export type SearchArtist = Artist;

export interface SearchPlaylist {
  _id: string;
  name: string;
  description: string;
  tracks: string[];
  owner_id: string;
  collaborators: string[];
  isPublic: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SearchUser {
  _id: string;
  username: string;
  liked_tracks?: string[];
  liked_albums?: string[];
  favorite_artists?: string[];
  createdAt?: string;
  updatedAt?: string;
}
