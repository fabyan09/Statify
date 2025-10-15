import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AlbumDocument = HydratedDocument<Album>;

@Schema()
export class Album {
  @Prop({ required: true })
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
}

export const AlbumSchema = SchemaFactory.createForClass(Album);
