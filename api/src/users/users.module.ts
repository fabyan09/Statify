import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User, UserSchema } from './entities/user.entity';
import { TracksModule } from '../tracks/tracks.module';
import { AlbumsModule } from '../albums/albums.module';
import { ArtistsModule } from '../artists/artists.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    TracksModule,
    AlbumsModule,
    ArtistsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
