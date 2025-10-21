import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';

@Injectable()
export class SpotifyService {
  private spotifyApi: SpotifyApi;

  constructor(private configService: ConfigService) {
    const clientId = this.configService.get<string>('SPOTIFY_CLIENT_ID');
    const clientSecret = this.configService.get<string>('SPOTIFY_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new Error('Spotify API credentials are not configured');
    }

    this.spotifyApi = SpotifyApi.withClientCredentials(clientId, clientSecret);
  }

  /**
   * Récupère toutes les tracks d'un album depuis l'API Spotify
   * @param albumId L'ID Spotify de l'album
   * @returns Les tracks de l'album
   */
  async getAlbumTracks(albumId: string) {
    try {
      const album = await this.spotifyApi.albums.get(albumId);
      return album.tracks.items;
    } catch (error) {
      throw new Error(`Failed to fetch album tracks from Spotify: ${error.message}`);
    }
  }

  /**
   * Récupère les informations complètes d'un album depuis l'API Spotify
   * @param albumId L'ID Spotify de l'album
   * @returns Les informations de l'album
   */
  async getAlbum(albumId: string) {
    try {
      return await this.spotifyApi.albums.get(albumId);
    } catch (error) {
      throw new Error(`Failed to fetch album from Spotify: ${error.message}`);
    }
  }

  /**
   * Récupère les informations complètes de plusieurs tracks depuis l'API Spotify
   * L'API Spotify permet de récupérer jusqu'à 50 tracks à la fois
   * @param trackIds Les IDs Spotify des tracks
   * @returns Les informations complètes des tracks (incluant la popularité)
   */
  async getTracks(trackIds: string[]) {
    try {
      const tracks = await this.spotifyApi.tracks.get(trackIds);
      return tracks;
    } catch (error) {
      throw new Error(`Failed to fetch tracks from Spotify: ${error.message}`);
    }
  }
}
