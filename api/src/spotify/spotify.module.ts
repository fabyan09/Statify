import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SpotifyService } from './spotify.service';

@Module({
  imports: [ConfigModule],
  providers: [SpotifyService],
  exports: [SpotifyService],
})
export class SpotifyModule {}
