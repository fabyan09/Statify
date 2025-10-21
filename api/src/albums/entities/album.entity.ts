import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type AlbumDocument = HydratedDocument<Album>;

@Schema({ collection: 'albums', versionKey: false })
export class Album {
  @Prop({ type: String, required: true })
  _id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  album_type: string;

  @Prop({ required: true })
  total_tracks: number;

  @Prop({ required: true })
  release_date: string;

  @Prop({ required: true })
  release_date_precision: string;

  @Prop({ required: true })
  popularity: number;

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

  @Prop({ required: true })
  label: string;

  @Prop({ type: [{ type: MongooseSchema.Types.String, ref: 'Artist' }], default: [] })
  artist_ids: string[];

  @Prop({ type: [String], default: [] })
  track_ids: string[];

  @Prop({ type: [String], default: [] })
  genres: string[];

  @Prop({ type: Boolean, default: false })
  spotify_synced: boolean;
}

export const AlbumSchema = SchemaFactory.createForClass(Album);

// Text index pour la recherche full-text
AlbumSchema.index({ name: 'text' });
