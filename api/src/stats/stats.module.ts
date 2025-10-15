import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StatsService } from './stats.service';
import { StatsController } from './stats.controller';
import { Artist, ArtistSchema } from '../artists/entities/artist.entity';
import { Album, AlbumSchema } from '../albums/entities/album.entity';
import { Track, TrackSchema } from '../tracks/entities/track.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Artist.name, schema: ArtistSchema },
      { name: Album.name, schema: AlbumSchema },
      { name: Track.name, schema: TrackSchema },
    ]),
  ],
  providers: [StatsService],
  controllers: [StatsController],
})
export class StatsModule {}
