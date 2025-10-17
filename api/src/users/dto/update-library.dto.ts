export class UpdateLibraryDto {
  liked_tracks?: string[];
  liked_albums?: string[];
  favorite_artists?: string[];
}

export class AddToLibraryDto {
  track_id?: string;
  album_id?: string;
  artist_id?: string;
}

export class RemoveFromLibraryDto {
  track_id?: string;
  album_id?: string;
  artist_id?: string;
}
