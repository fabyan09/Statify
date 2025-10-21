import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { Track, TrackSchema } from '../tracks/entities/track.entity';
import { Album, AlbumSchema } from '../albums/entities/album.entity';
import { Artist, ArtistSchema } from '../artists/entities/artist.entity';
import { User, UserSchema } from '../users/entities/user.entity';
import { Playlist, PlaylistSchema } from '../playlists/entities/playlist.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Track.name, schema: TrackSchema },
      { name: Album.name, schema: AlbumSchema },
      { name: Artist.name, schema: ArtistSchema },
      { name: User.name, schema: UserSchema },
      { name: Playlist.name, schema: PlaylistSchema },
    ]),
  ],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
