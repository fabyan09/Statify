export class AddTracksDto {
  track_ids: string[];
}

export class RemoveTracksDto {
  track_ids: string[];
}

export class AddCollaboratorDto {
  user_id: string;
}

export class RemoveCollaboratorDto {
  user_id: string;
}
