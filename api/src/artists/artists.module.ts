import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ArtistsService } from './artists.service';
import { ArtistsController } from './artists.controller';
import { Artist, ArtistSchema } from './entities/artist.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Artist.name, schema: ArtistSchema }]),
  ],
  controllers: [ArtistsController],
  providers: [ArtistsService],
})
export class ArtistsModule {}
