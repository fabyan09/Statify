import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PlaylistsService } from './playlists.service';
import { PlaylistsController } from './playlists.controller';
import { Playlist, PlaylistSchema } from './entities/playlist.entity';
import { TracksModule } from '../tracks/tracks.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Playlist.name, schema: PlaylistSchema }]),
    TracksModule,
  ],
  controllers: [PlaylistsController],
  providers: [PlaylistsService],
  exports: [PlaylistsService],
})
export class PlaylistsModule {}
