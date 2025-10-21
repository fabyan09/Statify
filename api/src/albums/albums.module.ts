import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AlbumsService } from './albums.service';
import { AlbumsController } from './albums.controller';
import { Album, AlbumSchema } from './entities/album.entity';
import { SpotifyModule } from '../spotify/spotify.module';
import { TracksModule } from '../tracks/tracks.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Album.name, schema: AlbumSchema }]),
    SpotifyModule,
    forwardRef(() => TracksModule),
  ],
  controllers: [AlbumsController],
  providers: [AlbumsService],
  exports: [AlbumsService],
})
export class AlbumsModule {}
