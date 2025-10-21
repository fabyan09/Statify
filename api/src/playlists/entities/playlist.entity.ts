import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type PlaylistDocument = HydratedDocument<Playlist>;

@Schema({ collection: 'playlists', versionKey: false, timestamps: true })
export class Playlist {
  @Prop({ required: true })
  name: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ type: [String], default: [] })
  tracks: string[];

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  owner_id: string;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }], default: [] })
  collaborators: string[];

  @Prop({ default: false })
  isPublic: boolean;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const PlaylistSchema = SchemaFactory.createForClass(Playlist);

// Text index pour la recherche full-text (nom + description)
PlaylistSchema.index({ name: 'text', description: 'text' });
