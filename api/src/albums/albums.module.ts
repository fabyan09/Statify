import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AlbumsService } from './albums.service';
import { AlbumsController } from './albums.controller';
import { Album, AlbumSchema } from './entities/album.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Album.name, schema: AlbumSchema }]),
  ],
  controllers: [AlbumsController],
  providers: [AlbumsService],
})
export class AlbumsModule {}
