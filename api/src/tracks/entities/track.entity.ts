import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TrackDocument = HydratedDocument<Track>;

@Schema({ collection: 'tracks', versionKey: false })
export class Track {
  @Prop({ type: String, required: true })
  _id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  popularity: number;

  @Prop({ required: true })
  duration_ms: number;

  @Prop({ required: true })
  explicit: boolean;

  @Prop()
  preview_url: string;

  @Prop({ required: true })
  track_number: number;

  @Prop({ required: true })
  disc_number: number;

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

  @Prop({ required: true })
  album_id: string;

  @Prop({ type: [String], default: [] })
  artist_ids: string[];

  @Prop({ required: true })
  added_at: string;

  @Prop({ required: true })
  added_by: string;

  @Prop({ required: true })
  playlist_id: string;

  @Prop({ required: true })
  playlist_name: string;
}

export const TrackSchema = SchemaFactory.createForClass(Track);
