import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ArtistsModule } from './artists/artists.module';
import { AlbumsModule } from './albums/albums.module';
import { TracksModule } from './tracks/tracks.module';
import { StatsModule } from './stats/stats.module';
import { UsersModule } from './users/users.module';
import { PlaylistsModule } from './playlists/playlists.module';
import { SearchModule } from './search/search.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CacheModule.register({
      isGlobal: true,
      ttl: 3600000, // 1 hour in milliseconds
      max: 100, // maximum number of items in cache
    }),
    MongooseModule.forRoot(process.env.MONGO_URL!),
    ArtistsModule,
    AlbumsModule,
    TracksModule,
    StatsModule,
    UsersModule,
    PlaylistsModule,
    SearchModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
