import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ArtistDocument = HydratedDocument<Artist>;

@Schema({ collection: 'artists', versionKey: false })
export class Artist {
  @Prop({ type: String, required: true })
  _id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  popularity: number;

  @Prop({ required: true })
  followers: number;

  @Prop({ type: [String], default: [] })
  genres: string[];

  @Prop({ required: true })
  href: string;

  @Prop({ required: true })
  uri: string;

  @Prop({
    type: {
      spotify: String,
    },
    _id: false,
  })
  external_urls: {
    spotify: string;
  };

  @Prop({
    type: [
      {
        url: String,
        height: Number,
        width: Number,
      },
    ],
    default: [],
    _id: false,
  })
  images: {
    url: string;
    height: number;
    width: number;
  }[];
}

export const ArtistSchema = SchemaFactory.createForClass(Artist);

// Text index pour la recherche full-text (nom + genres)
ArtistSchema.index({ name: 'text', genres: 'text' });
