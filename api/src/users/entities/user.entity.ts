import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ collection: 'users', versionKey: false, timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true })
  password: string;

  @Prop({ type: [String], default: [] })
  liked_tracks: string[];

  @Prop({ type: [String], default: [] })
  liked_albums: string[];

  @Prop({ type: [String], default: [] })
  favorite_artists: string[];

  @Prop({ type: Object, default: null })
  recommendations?: {
    sections: Array<{
      title: string;
      description: string;
      icon: string;
      type: 'artist' | 'album' | 'track';
      itemIds: string[]; // Stocker seulement les IDs
    }>;
    lastUpdated: Date;
  };

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Text index pour la recherche full-text
UserSchema.index({ username: 'text' });
