export class CreatePlaylistDto {
  name: string;
  description?: string;
  owner_id: string;
  isPublic?: boolean;
  tracks?: string[];
}
